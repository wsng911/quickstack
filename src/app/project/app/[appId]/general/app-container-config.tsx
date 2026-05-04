'use client';

import { 提交Button } from "@/components/custom/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, Alert描述 } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { saveGeneralAppContainerConfig } from "./actions";
import { useFormState } from "react-dom";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type ReactNode, useEffect } from "react";
import { toast } from "sonner";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { appContainerConfigZodModel } from "@/shared/model/app-container-config.model";

export type AppContainerConfigInputModel = z.infer<typeof appContainerConfigZodModel>;

function LabelWithHint({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
    return (
        <div class名称="flex items-center gap-1.5">
            <FormLabel class名称="m-0">{children}</FormLabel>
            {hint && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            class名称="h-5 w-5 text-muted-foreground hover:text-foreground"
                        >
                            <HelpCircle class名称="h-3.5 w-3.5" />
                            <span class名称="sr-only">More information</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" class名称="max-w-80">
                        <div class名称="text-sm leading-relaxed">{hint}</div>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

export default function GeneralAppContainerConfig({ app, readonly }: {
    app: AppExtendedModel;
    readonly: boolean;
}) {
    // Parse containerArgs from JSON string to array
    const initialArgs = app.containerArgs
        ? JSON.parse(app.containerArgs).map((arg: string) => ({ value: arg }))
        : [];

    const form = useForm<AppContainerConfigInputModel>({
        resolver: zodResolver(appContainerConfigZodModel),
        defaultValues: {
            containerCommand: app.containerCommand || '',
            containerArgs: initialArgs,
            securityContextRunAsUser: app.securityContextRunAsUser ?? undefined,
            securityContextRunAsGroup: app.securityContextRunAsGroup ?? undefined,
            securityContextFsGroup: app.securityContextFsGroup ?? undefined,
            securityContextPrivileged: app.securityContextPrivileged ?? false,
        },
        disabled: readonly,
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "containerArgs",
    });

    const [state, formAction] = useFormState(
        (state: ServerActionResult<any, any>, payload: AppContainerConfigInputModel) =>
            saveGeneralAppContainerConfig(state, payload, app.id),
        FormUtils.getInitialFormState<typeof appContainerConfigZodModel>()
    );

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('Container Configuration 保存d', {
                description: "Click \"deploy\" to apply the changes to your app.",
            });
        }
        FormUtils.mapValidationErrorsToForm<typeof appContainerConfigZodModel>(state, form)
    }, [state]);

    const values = form.watch();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Container Configuration</CardTitle>
                <Card描述>
                    Override image defaults only when your workload needs custom startup behavior or Linux security settings.
                </Card描述>
            </CardHeader>
            <Form {...form}>
                <TooltipProvider delayDuration={150}>
                    <form action={(e) => form.handle提交((data) => {
                        return formAction(data);
                    })()}>
                        <CardContent class名称="space-y-6">
                            <div class名称="space-y-4">
                                <div class名称="space-y-1">
                                    <p class名称="text-sm font-medium">Runtime</p>
                                    <p class名称="text-sm text-muted-foreground">
                                        Leave these fields empty to keep the command and arguments from the container image.
                                    </p>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="containerCommand"
                                    render={({ field }) => (
                                        <FormItem>
                                            <LabelWithHint hint="Overrides the image ENTRYPOINT. Leave empty to keep the command defined by the container image.">
                                                Command
                                            </LabelWithHint>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., /bin/sh or minio"
                                                    {...field}
                                                    value={field.value as string | number | readonly string[] | undefined}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div class名称="space-y-3">
                                    <LabelWithHint hint="Overrides the image CMD. 添加 one item per argument in the order the process should receive them.">
                                        Arguments
                                    </LabelWithHint>

                                    <div class名称="space-y-2">
                                        {fields.length === 0 && (
                                            <div class名称="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                                                No arguments configured.
                                            </div>
                                        )}

                                        {fields.map((field, index) => (
                                            <div key={field.id} class名称="flex items-start gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`containerArgs.${index}.value`}
                                                    render={({ field }) => (
                                                        <FormItem class名称="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={`Argument ${index + 1}`}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    class名称="mt-0"
                                                    onClick={() => remove(index)}
                                                    disabled={readonly}
                                                >
                                                    <Trash2 class名称="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>

                                    {!readonly && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => append({ value: '' })}
                                        >
                                            <Plus class名称="mr-2 h-4 w-4" />
                                            添加 Argument
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div class名称="space-y-4">
                                <div class名称="space-y-1">
                                    <p class名称="text-sm font-medium">Security Context</p>
                                    <p class名称="text-sm text-muted-foreground">
                                        Change these values only when your image, mounted volumes, or tooling require specific Linux permissions.
                                    </p>
                                </div>

                                <div class名称="grid gap-4 md:grid-cols-3">
                                    <FormField
                                        control={form.control}
                                        name="securityContextRunAsUser"
                                        render={({ field }) => (
                                            <FormItem>
                                                <LabelWithHint hint="Linux user ID for the main container process. Maps to runAsUser in the Kubernetes securityContext.">
                                                    Run As User
                                                </LabelWithHint>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g., 1001"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="securityContextRunAsGroup"
                                        render={({ field }) => (
                                            <FormItem>
                                                <LabelWithHint hint="Linux group ID for the main container process. Maps to runAsGroup in the Kubernetes securityContext.">
                                                    Run As Group
                                                </LabelWithHint>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g., 1001"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="securityContextFsGroup"
                                        render={({ field }) => (
                                            <FormItem>
                                                <LabelWithHint hint="Supplemental group ID applied at pod level so mounted volumes can be owned and writable by that group. Maps to fsGroup in the Kubernetes securityContext.">
                                                    FS Group
                                                </LabelWithHint>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="e.g., 1001"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="securityContextPrivileged"
                                    render={({ field }) => (
                                        <FormItem class名称="space-y-3 rounded-md border p-4">
                                            <div class名称="flex items-start gap-4">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? false}
                                                        onCheckedChange={field.onChange}
                                                        disabled={readonly}
                                                    />
                                                </FormControl>
                                                <div class名称="space-y-3 pt-0.5">
                                                    <LabelWithHint
                                                        hint={(
                                                            <>
                                                                <p>
                                                                    移除s most container isolation. The container gets all Linux capabilities,
                                                                    access to host devices, and can interact with the node almost like a root
                                                                    process on the host.
                                                                </p>
                                                                <p class名称="mt-2">
                                                                    If the container is compromised, it can affect the Kubernetes node and
                                                                    other workloads. Use this only for workloads such as Docker-in-Docker
                                                                    or low-level system tooling.
                                                                </p>
                                                            </>
                                                        )}
                                                    >
                                                        Privileged Mode
                                                    </LabelWithHint>

                                                    {values.securityContextPrivileged && <Alert class名称="border-amber-200 bg-amber-50 text-amber-950">
                                                        <Alert描述>
                                                            Enable this only if you fully understand the implications and risks.
                                                        </Alert描述>
                                                    </Alert>}
                                                </div>

                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                        {!readonly && (
                            <CardFooter class名称="gap-4">
                                <提交Button>保存</提交Button>
                                <p class名称="text-red-500">{state?.message}</p>
                            </CardFooter>
                        )}
                    </form>
                </TooltipProvider>
            </Form>
        </Card>
    );
}
