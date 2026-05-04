'use client'

import { NodeInfoModel } from "@/shared/model/node-info.model";
import { Card, CardContent, Card描述, CardHeader, CardTitle } from "@/components/ui/card";
import { Code } from "@/components/custom/code";
import { Toast } from "@/frontend/utils/toast.utils";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs, use确认Dialog } from "@/frontend/states/zustand.states";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { setNode状态 } from "./actions";
import 添加ClusterNodeDialog from "./add-cluster-node-dialog";

export default function NodeInfo({ nodeInfos, clusterJoinToken }: { nodeInfos: NodeInfoModel[]; clusterJoinToken?: string; }) {

    const { open确认Dialog: openDialog } = use确认Dialog();

    const setNode状态Click = async (node名称: string, schedulable: boolean) => {
        const confirmation = await openDialog({
            title: 'Update Node 状态',
            description: `Do you really want to ${schedulable ? 'activate' : 'deactivate'} Node ${node名称}? ${!schedulable ? 'This will stop all running containers on this node and moves the workload to the other nodes. Future workloads won\'t be scheduled on this node.' : ''}`,
            okButton: 'Yes',
            cancelButton: 'cancel'
        });
        if (confirmation) {
            Toast.fromAction(() => setNode状态(node名称, schedulable));
        }
    }

    return (
        <Card>
            <CardHeader class名称="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                    <CardTitle>Nodes</CardTitle>
                    <Card描述>概览 of all Nodes in your Cluster</Card描述>
                </div>
                <div class名称="flex justify-end">
                    <添加ClusterNodeDialog clusterJoinToken={clusterJoinToken}>
                        <Button>添加 Cluster Node</Button>
                    </添加ClusterNodeDialog>
                </div>
            </CardHeader>
            <CardContent>
                <div class名称="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {nodeInfos.map((nodeInfo, index) => (
                        <div key={index} class名称="space-y-4 rounded-lg border">
                            <h3 class名称={(nodeInfo.status && nodeInfo.schedulable ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700') + ' p-4 rounded-t-lg font-semibold text-xl text-center'}>
                                Node {index + 1}
                            </h3>
                            <div class名称="space-y-2 px-4 pb-2">
                                <div class名称="flex justify-center gap-4">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild><div class名称={(nodeInfo.pidOk ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700') + ' px-3 py-1.5 rounded cursor-pointer'}>CPU</div></TooltipTrigger>
                                            <TooltipContent>
                                                <p class名称="max-w-[350px]">{nodeInfo.pid状态Text}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div class名称={(nodeInfo.memoryOk ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700') + ' px-3 py-1.5 rounded cursor-pointer'}>RAM</div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p class名称="max-w-[350px]">{nodeInfo.memory状态Text}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div class名称={(nodeInfo.diskOk ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700') + ' px-3 py-1.5 rounded cursor-pointer'}>Disk</div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p class名称="max-w-[350px]">{nodeInfo.disk状态Text}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>


                                </div>
                                <div class名称="pt-2">
                                    <span class名称="font-semibold">名称:</span> <Code>{nodeInfo.name}</Code>
                                </div>
                                <div>
                                    <span class名称="font-semibold">Schedulable:</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span class名称={nodeInfo.schedulable ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}> {nodeInfo.schedulable ? 'Yes' : 'No'}</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p class名称="max-w-[350px]">{nodeInfo.schedulable ? 'Node is ready to run containers.' : 'Node ist deactivated. All containers will be scheduled on other nodes.'}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div>
                                    <span class名称="font-semibold">IP:</span> <Code>{nodeInfo.ip}</Code>
                                </div>
                                <div class名称="text-xs text-slate-500 pt-2">
                                    <span class名称="font-semibold">Master Node:</span> {nodeInfo.isMasterNode ? 'Yes' : 'No'}<br />
                                    <span class名称="font-semibold">Spec:</span> {nodeInfo.cpuCapacity} CPU Cores, {nodeInfo.ramCapacity} Memory<br />
                                    <span class名称="font-semibold">OS:</span> {nodeInfo.os} | {nodeInfo.architecture}<br />
                                    <span class名称="font-semibold">Kernel Version:</span> {nodeInfo.kernelVersion}<br />
                                    <span class名称="font-semibold">Container Runtime Version:</span> {nodeInfo.containerRuntimeVersion}<br />
                                    <span class名称="font-semibold">Kube Proxy Version:</span> {nodeInfo.kubeProxyVersion}<br />
                                    <span class名称="font-semibold">Kubelet Version:</span> {nodeInfo.kubeletVersion}
                                </div>
                            </div>
                            {index !== 0 && <div class名称="flex px-4 pb-4 gap-4">
                                <Button onClick={() => setNode状态Click(nodeInfo.name, !nodeInfo.schedulable)} variant="outline">{nodeInfo.schedulable ? 'Deactivate' : 'Activate'} Node</Button>
                            </div>}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
