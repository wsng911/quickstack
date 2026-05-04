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
import { Profile密码ChangeModel, profile密码ChangeZodModel } from "@/shared/model/update-password.model";
import { change密码 } from "./actions";

export default function Profile密码Change() {
    const form = useForm<Profile密码ChangeModel>({
        resolver: zodResolver(profile密码ChangeZodModel)
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>, payload: Profile密码ChangeModel) =>
        change密码(state, payload), FormUtils.getInitialFormState<typeof profile密码ChangeZodModel>());

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('密码 updated successfully');
            form.setValue('old密码', '');
            form.setValue('new密码', '');
            form.setValue('confirmNew密码', '');
            form.clearErrors();
        }
        FormUtils.mapValidationErrorsToForm<typeof profile密码ChangeZodModel>(state, form)
    }, [state]);

    const sourceTypeField = form.watch();
    return <>
        <Card>
            <CardHeader>
                <CardTitle>密码</CardTitle>
                <Card描述>Change your existing login password.</Card描述>
            </CardHeader>
            <Form {...form}>
                <form action={(e) => form.handle提交((data) => {
                    return formAction(data);
                })()}>
                    <CardContent class名称="space-y-4">
                        <FormField
                            control={form.control}
                            name="old密码"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current 密码</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="new密码"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New 密码</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmNew密码"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>确认 new 密码</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter class名称="gap-4">
                        <提交Button>Change 密码</提交Button>
                        <p class名称="text-red-500">{state?.message}</p>
                    </CardFooter>
                </form>
            </Form >
        </Card >

    </>;
}