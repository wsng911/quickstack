'use client';

import { 提交Button } from "@/components/custom/submit-button";
import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model";
import { useEffect } from "react";
import { toast } from "sonner";
import { setTraefikIpPropagation } from "./actions";
import { TraefikIpPropagation状态 } from "@/shared/model/traefik-ip-propagation.model";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const traefik设置ZodModel = z.object({
    enableIpPreservation: z.boolean()
});

type Traefik设置Model = z.infer<typeof traefik设置ZodModel>;

export default function QuickStackTraefik设置({
    initial状态
}: {
    initial状态: TraefikIpPropagation状态;
}) {
    const currentEnabled = (initial状态.externalTrafficPolicy ?? 'Cluster') === 'Local';

    const form = useForm<Traefik设置Model>({
        resolver: zodResolver(traefik设置ZodModel),
        defaultValues: {
            enableIpPreservation: currentEnabled,
        }
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>,
        payload: Traefik设置Model) =>
        setTraefikIpPropagation(state, payload),
        FormUtils.getInitialFormState<typeof traefik设置ZodModel>());

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('Traefik settings updated successfully.');
        }
        FormUtils.mapValidationErrorsToForm<typeof traefik设置ZodModel>(state, form)
    }, [state]);

    const readinessText = `${initial状态.readyReplicas ?? 0}/${initial状态.replicas ?? 0} pods ready`;
    const lastRestart = initial状态.restartedAt ? new Date(initial状态.restartedAt).toLocaleString() : 'Not restarted yet';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Preserve Client IP</CardTitle>
                <Card描述>
                    Configure how Traefik handles incoming traffic and client IP preservation.
                </Card描述>
            </CardHeader>
            <Form {...form}>
                <form action={(e) => form.handle提交((data) => {
                    return formAction(data);
                })()}>
                    <CardContent class名称="space-y-4">
                        <div class名称="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div class名称="space-y-0.5">
                                <Label htmlFor="enableIpPreservation" class名称="text-base">
                                    Enable IP Preservation
                                </Label>
                                <div class名称="text-xs text-muted-foreground">{readinessText}</div>
                                <div class名称="text-xs text-muted-foreground">Last restart: {lastRestart}</div>
                            </div>
                            <Switch
                                id="enableIpPreservation"
                                checked={form.watch('enableIpPreservation')}
                                onCheckedChange={(checked) => form.setValue('enableIpPreservation', checked)}
                            />
                        </div>

                        <div class名称="text-sm text-muted-foreground space-y-2">
                            <p>
                                Setting <b>externalTrafficPolicy</b> to <b>Local</b> preserves the original client IP but may limit load-balancing flexibility.
                                Only activate this on a single-node cluster.
                            </p>
                            <p>
                                For further details, refer to the <a href="https://kubernetes.io/docs/tutorials/services/source-ip/#source-ip-for-services-with-type-nodeport" target="_blank" class名称="underline underline-offset-2">Kubernetes documentation</a>.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter class名称="gap-4">
                        <提交Button>保存</提交Button>
                       {state.status !== 'success' && <p class名称="text-red-500">{state?.message}</p>}
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
