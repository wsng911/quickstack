'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cleanupOldBuildJobs, cleanupOldTmpFiles, deleteAllFailedAndSuccededPods, deleteAllNetworkPolicies, deleteOldAppLogs, purgeRegistryImages, updateRegistry } from "./actions";
import { Button } from "@/components/ui/button";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { LogsDialog } from "@/components/custom/logs-overlay";
import { Constants } from "@/shared/utils/constants";
import { RotateCcw, SquareTerminal, Trash, ShieldOff } from "lucide-react";

export default function QuickStackMaintenance设置({
    qsPod名称
}: {
    qsPod名称?: string;
}) {

    const use确认 = use确认Dialog();

    return <div class名称="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Free Up Disk Space</CardTitle>
            </CardHeader>
            <CardContent class名称="flex gap-4 flex-wrap">

                <Button variant="secondary" onClick={async () => {
                    if (await use确认.open确认Dialog({
                        title: 'Purge Images',
                        description: 'This action deletes all build images from the internal QuickStack container registry. Use this action to free up disk space.',
                        okButton: "Purge Images",
                    })) {
                        Toast.fromAction(() => purgeRegistryImages());
                    }
                }}><Trash /> Purge Images</Button>

                <Button variant="secondary" onClick={async () => {
                    if (await use确认.open确认Dialog({
                        title: 'Cleanup Old Build Jobs',
                        description: 'This action deletes all old build jobs. Use this action to free up disk space.',
                        okButton: "Cleanup"
                    })) {
                        Toast.fromAction(() => cleanupOldBuildJobs());
                    }
                }}><Trash /> Cleanup Old Build Jobs</Button>

                <Button variant="secondary" onClick={async () => {
                    if (await use确认.open确认Dialog({
                        title: 'Cleanup Temp Files',
                        description: 'This action deletes all temporary files. Use this action to free up disk space.',
                        okButton: "Cleanup"
                    })) {
                        Toast.fromAction(() => cleanupOldTmpFiles());
                    }
                }}><Trash /> Cleanup Temp Files</Button>

                <Button variant="secondary" onClick={async () => {
                    if (await use确认.open确认Dialog({
                        title: '删除 old App logs',
                        description: 'This action deletes all old app logs. Use this action to free up disk space.',
                        okButton: "删除 old App logs"
                    })) {
                        Toast.fromAction(() => deleteOldAppLogs());
                    }
                }}><Trash /> 删除 old App logs</Button>

                <Button variant="secondary" onClick={async () => {
                    if (await use确认.open确认Dialog({
                        title: '删除 Orphaned 容器',
                        description: 'This action deletes all unused pods (failed or succeded). Use this action to free up resources.',
                        okButton: "删除 Orphaned 容器"
                    })) {
                        Toast.fromAction(() => deleteAllFailedAndSuccededPods());
                    }
                }}><Trash /> 删除 Orphaned 容器</Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>监控ing & Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent class名称="flex gap-4 flex-wrap">

                {qsPod名称 && <LogsDialog namespace={Constants.QS_NAMESPACE} pod名称={qsPod名称}>
                    <Button variant="secondary" ><SquareTerminal /> Open QuickStack Logs</Button>
                </LogsDialog>}

                <Button variant="secondary" onClick={async () => {
                    if (await use确认.open确认Dialog({
                        title: 'Update Registry',
                        description: 'This action will restart the internal QuickStack container registry.',
                        okButton: "Update Registry"
                    })) {
                        Toast.fromAction(() => updateRegistry());
                    }
                }}><RotateCcw /> Force Update Registry</Button>

            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Network Policies</CardTitle>
            </CardHeader>
            <CardContent class名称="flex gap-4 flex-wrap">

                <Button variant="destructive" onClick={async () => {
                    if (await use确认.open确认Dialog({
                        title: '⚠️ 删除 All Network Policies',
                        description: 'WARNING: This is a bad idea! This action will delete ALL network policies across all namespaces. Your applications will lose all network security restrictions. Only use this for troubleshooting or emergency situations. Are you absolutely sure?',
                        okButton: "Yes, 删除 All Policies",
                    })) {
                        Toast.fromAction(() => deleteAllNetworkPolicies());
                    }
                }}><ShieldOff /> 删除 All Network Policies</Button>

            </CardContent>
        </Card>
    </div>;
}