'use client'

import { Dialog, DialogContent, Dialog描述, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useFormState } from 'react-dom'
import { useEffect, useState } from "react";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { 提交Button } from "@/components/custom/submit-button";
import { AppNodePort } from "@prisma/client"
import { ServerActionResult } from "@/shared/model/server-action-error-return.model"
import { saveNodePort } from "./actions"
import { toast } from "sonner"
import { NodePort编辑Model, nodePort编辑ZodModel } from "@/shared/model/node-port-edit.model"

export default function NodePort编辑Dialog({ children, appNodePort, appId }: { children: React.ReactNode; appNodePort?: AppNodePort; appId: string; }) {

    const [isOpen, setIsOpen] = useState<boolean>(false);

    const form = useForm<NodePort编辑Model>({
        resolver: zodResolver(nodePort编辑ZodModel),
        defaultValues: appNodePort ? {
            port: appNodePort.port,
            nodePort: appNodePort.nodePort,
            protocol: appNodePort.protocol as 'TCP' | 'UDP',
        } : { protocol: 'TCP' }
    });

    const [state, formAction] = useFormState(
        (state: ServerActionResult<any, any>, payload: NodePort编辑Model) =>
            saveNodePort(state, { ...payload, appId, id: appNodePort?.id }),
        FormUtils.getInitialFormState<typeof nodePort编辑ZodModel>()
    );

    useEffect(() => {
        if (state.status === 'success') {
            form.reset();
            toast.success('Node port saved successfully.', {
                description: 'Click "deploy" to apply the changes to your app.',
            });
            setIsOpen(false);
        }
        FormUtils.mapValidationErrorsToForm<typeof nodePort编辑ZodModel>(state, form);
    }, [state]);

    useEffect(() => {
        if (appNodePort) {
            form.reset({
                port: appNodePort.port,
                nodePort: appNodePort.nodePort,
                protocol: appNodePort.protocol as 'TCP' | 'UDP',
            });
        }
    }, [appNodePort]);

    return (
        <>
            <div onClick={() => setIsOpen(true)}>
                {children}
            </div>
            <Dialog open={!!isOpen} onOpenChange={() => setIsOpen(false)}>
                <DialogContent class名称="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{appNodePort ? '编辑' : '添加'} Node Port</DialogTitle>
                        <Dialog描述>
                            Expose this app directly on a host/node port. Changes take effect after redeployment.
                        </Dialog描述>
                    </DialogHeader>
                    <Form {...form}>
                        <form action={(e) => form.handle提交((data) => {
                            return formAction(data);
                        })()}>
                            <div class名称="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="port"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Container Port</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="8080" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="nodePort"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Node Port</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="30080" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="protocol"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Protocol</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select protocol" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="TCP">TCP</SelectItem>
                                                    <SelectItem value="UDP">UDP</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <p class名称="text-red-500">{state.message}</p>
                                <提交Button>保存</提交Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
}
