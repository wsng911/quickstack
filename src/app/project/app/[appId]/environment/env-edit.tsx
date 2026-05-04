'use client';

import { 提交Button } from "@/components/custom/submit-button";
import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { saveEnvVariables } from "./actions";
import { useFormState } from "react-dom";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model";
import { useEffect } from "react";
import { toast } from "sonner";
import { AppEnvVariablesModel, appEnvVariablesZodModel } from "@/shared/model/env-edit.model";
import { Textarea } from "@/components/ui/textarea";
import { AppExtendedModel } from "@/shared/model/app-extended.model";


export default function Env编辑({ app, readonly }: {
    app: AppExtendedModel;
    readonly: boolean;
}) {
    const form = useForm<AppEnvVariablesModel>({
        resolver: zodResolver(appEnvVariablesZodModel),
        defaultValues: app,
        disabled: readonly,
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>, payload: AppEnvVariablesModel) => saveEnvVariables(state, payload, app.id), FormUtils.getInitialFormState<typeof appEnvVariablesZodModel>());
    useEffect(() => {
        if (state.status === 'success') {
            toast.success('Env Variables Limits 保存d', {
                description: "Click \"deploy\" to apply the changes to your app.",
            });
        }
        FormUtils.mapValidationErrorsToForm<typeof appEnvVariablesZodModel>(state, form);
    }, [state]);

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
                <Card描述>
                    Provide optional environment variables for your application.
                    {app.appType !== 'APP' && <div class名称="text-sm text-red-500 pt-2">You should not change ENV variables for databases.</div>}

                </Card描述>
            </CardHeader>
            <Form {...form}>
                <form action={(e) => form.handle提交((data) => {
                    return formAction(data);
                })()}>
                    <CardContent class名称="space-y-4">
                        <FormField
                            control={form.control}
                            name="envVars"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Env Variables</FormLabel>
                                    <FormControl>
                                        <Textarea class名称="h-96" placeholder="NAME=VALUE..." {...field} value={field.value} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    {!readonly && <CardFooter>
                        <提交Button>保存</提交Button>
                    </CardFooter>}
                </form>
            </Form >
        </Card >
    </>;
}