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
import { updatePublicIpv4设置, updatePublicIpv4设置Automatically } from "./actions";
import { QsPublicIpv4设置Model, qsPublicIpv4设置ZodModel } from "@/shared/model/qs-public-ipv4-settings.model";
import { Button } from "@/components/ui/button";
import { Toast } from "@/frontend/utils/toast.utils";

export default function QuickStackPublicIp设置({
    publicIpv4,
}: {
    publicIpv4?: string;
}) {
    const form = useForm<QsPublicIpv4设置Model>({
        resolver: zodResolver(qsPublicIpv4设置ZodModel),
        defaultValues: {
            publicIpv4,
        }
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>, payload: QsPublicIpv4设置Model) =>
        updatePublicIpv4设置(state, payload), FormUtils.getInitialFormState<typeof qsPublicIpv4设置ZodModel>());

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('设置 updated successfully.');
        }
        FormUtils.mapValidationErrorsToForm<typeof qsPublicIpv4设置ZodModel>(state, form)
    }, [state]);

    useEffect(() => {
        form.reset({ publicIpv4 });
    }, [publicIpv4]);

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Main Public IPv4 添加ress</CardTitle>
                <Card描述>Your main public IPv4 address is set automatically during the QuickStack setup.
                    If you wish to change it, you can do so here.
                    Make sure that your new IP is assigned to the server and reachable from the internet.
                </Card描述>
            </CardHeader>
            <Form {...form}>
                <form action={(e) => form.handle提交((data) => {
                    return formAction(data);
                })()}>
                    <CardContent class名称="space-y-4">
                        <FormField
                            control={form.control}
                            name="publicIpv4"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IP 添加ress</FormLabel>
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
                        <Button onClick={() => Toast.fromAction(() => updatePublicIpv4设置Automatically())} type="button" variant='ghost'>Evaluate automatically</Button>
                        <p class名称="text-red-500">{state?.message}</p>
                    </CardFooter>
                </form>
            </Form >
        </Card >

    </>;
}