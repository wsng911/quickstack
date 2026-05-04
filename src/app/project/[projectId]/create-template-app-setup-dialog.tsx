'use client'

import { Dialog, DialogContent, Dialog描述, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    Form描述,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useFormState } from 'react-dom'
import { useEffect, useState } from "react";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { 提交Button } from "@/components/custom/submit-button";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model"
import { toast } from "sonner"
import { AppTemplateModel, appTemplateZodModel } from "@/shared/model/app-template.model"
import { createAppFromTemplate } from "./actions"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function 创建TemplateAppSetupDialog({
    appTemplate,
    projectId,
    dialog关闭d
}: {
    appTemplate?: AppTemplateModel;
    projectId: string;
    dialog关闭d?: () => void;
}) {

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const form = useForm<AppTemplateModel>({
        resolver: zodResolver(appTemplateZodModel),
        defaultValues: appTemplate
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>,
        payload: AppTemplateModel) => createAppFromTemplate(state, payload, projectId!),
        FormUtils.getInitialFormState<typeof appTemplateZodModel>());

    useEffect(() => {
        if (state.status === 'success') {
            form.reset();
            const appLabel = ((appTemplate?.templates.length ?? 0) > 1) ? 'Apps' : 'App';
            toast.success(`${appLabel} 创建d successfully`, {
                description: `Click deploy to start the ${appLabel}.`,
            });
            setIsOpen(false);
            if (dialog关闭d) {
                dialog关闭d();
            }
        }
        FormUtils.mapValidationErrorsToForm<typeof appTemplateZodModel>(state, form);
    }, [state]);

    const values = form.watch();

    useEffect(() => {
        setIsOpen(!!appTemplate && !!projectId);
        form.reset(appTemplate);
    }, [appTemplate, projectId]);

    return (
        <>
            <Dialog open={!!isOpen} onOpenChange={(isOpened) => {
                setIsOpen(isOpened);
                if (!isOpened && dialog关闭d) {
                    dialog关闭d();
                }
            }}>
                <DialogContent class名称="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>创建 App "{appTemplate?.name}"</DialogTitle>
                        <Dialog描述>
                            Insert your values for the template.
                        </Dialog描述>
                    </DialogHeader>
                    <ScrollArea class名称="max-h-[70vh]">
                        <div class名称="px-2">
                            <Form {...form} >
                                <form action={(e) => form.handle提交((data) => {
                                    return formAction(data);
                                })()}>
                                    <div class名称="space-y-6">
                                        {appTemplate?.templates.map((t, templateIndex) => (
                                            <>
                                                {templateIndex > 0 && <div class名称="border-t pb-4"></div>}
                                                {appTemplate?.templates.length > 1 &&
                                                    <div class名称="text-2xl font-semibold">{t.appModel.name}</div>}
                                                <FormField
                                                    control={form.control}
                                                    name={`templates[${templateIndex}].appModel.name` as any}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>App 名称</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {t.input设置.map((input, settingsIndex) => (
                                                    <FormField
                                                        control={form.control}
                                                        name={`templates[${templateIndex}].input设置[${settingsIndex}].value` as any}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{input.label}</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} />
                                                                </FormControl>
                                                                {input.randomGeneratedIfEmpty &&
                                                                    <Form描述>If left empty, a random value will be generated.</Form描述>}
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </>
                                        ))}
                                        <p class名称="text-red-500">{state.message}</p>
                                        <提交Button>创建</提交Button>
                                    </div>

                                </form>
                            </Form >
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    )



}