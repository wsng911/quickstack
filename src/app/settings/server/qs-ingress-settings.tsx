'use client';

import { 提交Button } from "@/components/custom/submit-button";
import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, Form描述, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";
import { toast } from "sonner";
import { QsIngress设置Model, qsIngress设置ZodModel } from "@/shared/model/qs-settings.model";
import { updateIngress设置 } from "./actions";
import CheckboxFormField from "@/components/custom/checkbox-form-field";

export default function QuickStackIngress设置({
    serverUrl,
    disableNodePortAccess
}: {
    serverUrl: string;
    disableNodePortAccess: boolean;
}) {
    const form = useForm<QsIngress设置Model>({
        resolver: zodResolver(qsIngress设置ZodModel),
        defaultValues: {
            serverUrl,
            disableNodePortAccess: !disableNodePortAccess
        }
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>, payload: QsIngress设置Model) =>
        updateIngress设置(state, payload), FormUtils.getInitialFormState<typeof qsIngress设置ZodModel>());

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('设置 updated successfully. It may take a few seconds for the changes to take effect.');
        }
        FormUtils.mapValidationErrorsToForm<typeof qsIngress设置ZodModel>(state, form)
    }, [state]);

    const sourceTypeField = form.watch();
    return <>
        <Card>
            <CardHeader>
                <CardTitle>Panel Domain</CardTitle>
                <Card描述>Change the domain settings for your QuickStack instance.</Card描述>
            </CardHeader>
            <Form {...form}>
                <form action={(e) => form.handle提交((data) => {
                    return formAction({
                        ...data,
                        disableNodePortAccess: !data.disableNodePortAccess
                    });
                })()}>
                    <CardContent class名称="space-y-4">
                        <FormField
                            control={form.control}
                            name="serverUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Domain</FormLabel>
                                    <FormControl>
                                        <Input  {...field} />
                                    </FormControl>
                                    <Form描述>
                                        Make sure the DNS settings of the domain are correctly configured to point to the server IP address.
                                    </Form描述>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <CheckboxFormField
                            form={form}
                            name="disableNodePortAccess"
                            label="Serve QuickStack over IP 添加ress and Port 30000"
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