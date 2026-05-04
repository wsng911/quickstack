import { Card, CardContent, Card描述, CardHeader, CardTitle } from "@/components/ui/card";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { useEffect, useState } from "react";
import LogsStreamed from "../../../../../components/custom/logs-streamed";
import { getPodsForApp as getPodsForAppAction } from "./actions";
import { PodsInfoModel } from "@/shared/model/pods-info.model";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FullLoadingSpinner from "@/components/ui/full-loading-spinnter";
import { toast } from "sonner";
import { LogsDialog } from "@/components/custom/logs-overlay";
import { Button } from "@/components/ui/button";
import { Download, Expand, Terminal } from "lucide-react";
import { TerminalDialog } from "./terminal-overlay";
import { LogsDownloadOverlay } from "./logs-download-overlay";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RolePermissionEnum } from "@/shared/model/role-extended.model.ts";
import { usePods状态 } from "@/frontend/states/zustand.states";

export default function Logs({
    app,
    role
}: {
    app: AppExtendedModel;
    role: RolePermissionEnum;
}) {
    const [selectedPod, setSelectedPod] = useState<PodsInfoModel | undefined>(undefined);
    const [appPods, setAppPods] = useState<PodsInfoModel[] | undefined>(undefined);
    const { subscribeTo状态Changes, getPodsForApp } = usePods状态();

    const updateBuilds = async () => {
        try {
            const response = await getPodsForAppAction(app.id);
            if (response.status === 'success' && response.data) {
                setAppPods(response.data);
            } else {
                console.error(response);
                toast.error(response.message ?? 'An unknown error occurred while loading pods.');
            }
        } catch (ex) {
            console.error(ex);
            toast.error('An unknown error occurred while loading pods.');
        }
    }

    useEffect(() => {
        updateBuilds();
        const unsubscribe = subscribeTo状态Changes((changedAppIds) => {
            if (changedAppIds.includes(app.id)) {
                setTimeout(() =>
                    updateBuilds(), 500); // slight delay to ensure data is updated

                // Update also after 10 Seconds --> for examaple when app stopped or redeployed to get final state of old container
                setTimeout(() =>
                    updateBuilds(), 10000);

            }
        });
        return () => unsubscribe();
    }, [app.id]);

    useEffect(() => {
        if (appPods && selectedPod && !appPods.find(p => p.pod名称 === selectedPod.pod名称)) {
            // current selected pod is not in the list anymore
            setSelectedPod(undefined);
            if (appPods.length > 0) {
                setSelectedPod(appPods[0]);
            }
        } else if (!selectedPod && appPods && appPods.length > 0) {
            // no pod selected yet, initialize with first pod
            setSelectedPod(appPods[0]);
        }
    }, [appPods]);

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Logs</CardTitle>
                <Card描述>Read logs from all running 容器.</Card描述>
            </CardHeader>
            <CardContent class名称="space-y-4">
                {!appPods && <FullLoadingSpinner />}
                {appPods && appPods.length === 0 && <div>No running pods found for this app.</div>}
                {selectedPod && appPods && <div class名称="flex gap-4">
                    <div class名称="flex-1">
                        <Select value={selectedPod.pod名称} onValueChange={(val) => setSelectedPod(appPods.find(p => p.pod名称 === val))}>
                            <SelectTrigger class名称="w-full" >
                                <SelectValue placeholder="Pod wählen" />
                            </SelectTrigger>
                            <SelectContent>
                                {appPods.map(pod => <SelectItem key={pod.pod名称} value={pod.pod名称}>{pod.pod名称} ({pod.status})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {role === RolePermissionEnum.READWRITE && <div>
                        <TerminalDialog terminalInfo={{
                            pod名称: selectedPod.pod名称,
                            container名称: selectedPod.container名称,
                            namespace: app.projectId
                        }} >
                            <Button variant="secondary">
                                <Terminal />  Terminal
                            </Button>
                        </TerminalDialog>
                    </div>}
                    <div>
                        <TooltipProvider>
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger>
                                    <LogsDownloadOverlay appId={app.id} >
                                        <Button variant="secondary">
                                            <Download />
                                        </Button>
                                    </LogsDownloadOverlay>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Download Logs</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger>
                                <LogsDialog namespace={app.projectId} pod名称={selectedPod.pod名称}>
                                    <Button variant="secondary">
                                        <Expand />
                                    </Button>
                                </LogsDialog>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Fullscreen Logs</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>}
                {app.projectId && selectedPod && <LogsStreamed namespace={app.projectId} pod名称={selectedPod.pod名称} />}
            </CardContent>
        </Card >
    </>;
}
