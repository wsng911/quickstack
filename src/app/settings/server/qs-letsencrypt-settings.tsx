'use client';

import { 提交Button } from "@/components/custom/submit-button";
import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { toast } from "sonner";
import { updateLetsEncrypt设置 } from "./actions";
import { QsLetsEncrypt设置Model, qsLetsEncrypt设置ZodModel } from "@/shared/model/qs-letsencrypt-settings.model";

export default function QuickStackLetsEncrypt设置({
    letsEncryptMail,
}: {
    letsEncryptMail: string;
}) {
    const form = useForm<QsLetsEncrypt设置Model>({
        resolver: zodResolver(qsLetsEncrypt设置ZodModel),
        defaultValues: {
            letsEncryptMail,
        }
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>, payload: QsLetsEncrypt设置Model) =>
        updateLetsEncrypt设置(state, payload), FormUtils.getInitialFormState<typeof qsLetsEncrypt设置ZodModel>());

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('设置 updated successfully. It may take a few seconds for the changes to take effect.');
        }
        FormUtils.mapValidationErrorsToForm<typeof qsLetsEncrypt设置ZodModel>(state, form)
    }, [state]);

    const sourceTypeField = form.watch();
    return <>
        <Card>
            <CardHeader>
                <CardTitle>SSL Certificates</CardTitle>
                <Card描述>To issue SSL Certificates to your Apps, provide your Let's Encrypt email address.</Card描述>
            </CardHeader>
            <Form {...form}>
                <form action={(e) => form.handle提交((data) => {
                    return formAction(data);
                })()}>
                    <CardContent class名称="space-y-4">
                        <FormField
                            control={form.control}
                            name="letsEncryptMail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Let's Encrypt 邮箱</FormLabel>
                                    <FormControl>
                                        <Input  {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    </CardContent>
                    <CardFooter class名称="gap-4">
                        <提交Button>保存</提交Button>
                        <p class名称="text-red-500">{state?.message}</p>
                    </CardFooter>
                </form>
            </Form >
        </Card >

    </>;
}