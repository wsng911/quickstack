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
import { Build设置Model, build设置ZodModel } from "@/shared/model/build-settings.model";
import { useEffect } from "react";
import { toast } from "sonner";
import { saveBuild设置 } from "./actions";
import { NodeInfoModel } from "@/shared/model/node-info.model";
import { Alert, Alert描述, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Constants } from "@/shared/utils/constants";

export default function QsBuild设置({
    build设置,
    nodes,
}: {
    build设置: Build设置Model;
    nodes: NodeInfoModel[];
}) {
    const form = useForm<Build设置Model>({
        resolver: zodResolver(build设置ZodModel),
        defaultValues: {
            ...build设置,
            buildNode: build设置.buildNode || Constants.BUILD_AUTO_NODE_VALUE,
        },
    });

    const [state, formAction] = useFormState(
        (state: ServerActionResult<any, any>, payload: Build设置Model) => saveBuild设置(state, payload),
        FormUtils.getInitialFormState<typeof build设置ZodModel>()
    );

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('Build settings saved.');
        }
        FormUtils.mapValidationErrorsToForm<typeof build设置ZodModel>(state, form);
    }, [state]);

    const watchedBuildNode = form.watch('buildNode');
    const isK3sNative = watchedBuildNode === Constants.BUILD_NODE_K3S_NATIVE_VALUE;
    const showReservationAlert = !build设置.memoryReservation || !build设置.cpuReservation;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Build Container 设置</CardTitle>
                <Card描述>
                    Configure global resource limits and node placement for all build containers.
                </Card描述>
            </CardHeader>
            <Form {...form}>
                <form action={(e) => form.handle提交((data) => {
                    const payload = {
                        ...data,
                        buildNode: data.buildNode === Constants.BUILD_AUTO_NODE_VALUE || data.buildNode === '' ? null : data.buildNode,
                    };
                    return formAction(payload);
                })()}>
                    <CardContent class名称="space-y-6">
                        <div class名称="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="buildNode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Build Node (optional)</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || Constants.BUILD_AUTO_NODE_VALUE}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Auto (node with most available resources)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={Constants.BUILD_AUTO_NODE_VALUE}>
                                                    Auto (node with most available resources)
                                                </SelectItem>
                                                <SelectItem value={Constants.BUILD_NODE_K3S_NATIVE_VALUE}>
                                                    k3s native
                                                </SelectItem>
                                                {nodes.map((node) => (
                                                    <SelectItem
                                                        key={node.name}
                                                        value={node.name}
                                                        disabled={!node.schedulable}
                                                    >
                                                        {node.name}{!node.schedulable ? ' (not schedulable)' : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {isK3sNative && showReservationAlert && (
                            <Alert>
                                <AlertCircle class名称="h-4 w-4" />
                                <AlertTitle>Reservations not configured</AlertTitle>
                                <Alert描述>
                                    No CPU and/or memory reservations are set. Setting them is recommended for optimal build container scheduling.
                                </Alert描述>
                            </Alert>
                        )}

                        {isK3sNative && <div class名称="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="memoryLimit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Memory Limit (MB)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value as string | number | undefined ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="memoryReservation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Memory Reservation (MB)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value as string | number | undefined ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cpuLimit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CPU Limit (m)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value as string | number | undefined ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cpuReservation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CPU Reservation (m)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} value={field.value as string | number | undefined ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>}
                    </CardContent>
                    <CardFooter class名称="gap-4">
                        <提交Button>保存</提交Button>
                        <p class名称="text-red-500">{state?.message}</p>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
