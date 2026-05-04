'use client';

import { 提交Button } from "@/components/custom/submit-button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { toast } from "sonner";
import { createNewTotpToken, verifyTotpToken } from "./actions";
import { Dialog, DialogContent, Dialog描述, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import React from "react";
import { TotpModel, totpZodModel } from "@/shared/model/totp.model";
import { Toast } from "@/frontend/utils/toast.utils";
import FullLoadingSpinner from "@/components/ui/full-loading-spinnter";

export default function Totp创建Dialog({
    children
}: {
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [totpQrCode, setTotpQrCode] = React.useState<string | null>(null);

    const form = useForm<TotpModel>({
        resolver: zodResolver(totpZodModel)
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>, payload: TotpModel) =>
        verifyTotpToken(state, payload), FormUtils.getInitialFormState<typeof totpZodModel>());

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('2FA settings updated successfully');
            form.setValue('totp', '');
            form.clearErrors();
            setIsOpen(false);
        }
        FormUtils.mapValidationErrorsToForm<typeof totpZodModel>(state, form)
    }, [state]);

    const createTotpToken = async () => {
        setIsOpen(true);
        const response = await Toast.fromAction(() => createNewTotpToken());
        if (response.status === 'success') {
            const qrCode = response.data!;
            setTotpQrCode(qrCode);
        }
    };

    return <>
        <div onClick={() => createTotpToken()}>
            {children}
        </div>
        <Dialog open={isOpen} onOpenChange={(isO) => setIsOpen(isO)}>
            <DialogContent class名称="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Enable 2FA</DialogTitle>
                    <Dialog描述>
                        To enable the Two-Facor-Authentication (2FA) scan the QR code with your preferred authenticator app and enter the token below.
                    </Dialog描述>
                </DialogHeader>
                <div class名称="space-y-4">
                    {!totpQrCode && <div class名称="rounded-lg bg-slate-50 py-24"><FullLoadingSpinner /></div>}
                    {totpQrCode && <><img class名称="mx-auto my-0" src={totpQrCode} /></>}
                    <Form {...form}>
                        <form action={(e) => form.handle提交((data) => {
                            return formAction(data);
                        })()}>
                            <div class名称="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="totp"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>2FA Token</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <p class名称="text-red-500">{state?.message}</p>
                            </div>
                            <DialogFooter>
                                <提交Button>Verify 2FA Token</提交Button>
                            </DialogFooter>
                        </form>
                    </Form >
                </div>
            </DialogContent>
        </Dialog>


    </>;
}