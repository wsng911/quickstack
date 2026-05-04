'use client'

import { usePods状态 } from '@/frontend/states/zustand.states';
import { cn } from '@/frontend/utils/utils';
import { Spinner } from "@/components/ui/spinner"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Pod状态IndicatorProps {
    appId: string;
    showLabel?: boolean;
}

export default function Pod状态Indicator({ appId, showLabel }: Pod状态IndicatorProps) {
    const { getPodsForApp, isLoading } = usePods状态();
    const appPods = getPodsForApp(appId);

    if (isLoading) {
        return (
            <div class名称="flex items-center gap-2">
                <Spinner class名称="size-3" />
            </div>
        );
    }

    if (!appPods) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div class名称="flex items-center gap-2 w-fit">
                        <div class名称="w-3 h-3 rounded-full bg-red-400" />
                        {showLabel && <span class名称="text-xs text-gray-500">Unknown</span>}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Could not retrieve deployment status</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    let statusColor = 'bg-gray-400';
    const runningPods = appPods.readyReplicas ?? 0;
    const expected = appPods.replicas ?? 0;
    let statusLabel = `${runningPods}/${expected}`;
    let tooltipText = `${runningPods} of ${expected} Pods running`;

    if (appPods.deployment状态 === 'SHUTDOWN') {
        statusColor = 'bg-gray-400';
        statusLabel = 'Off';
        tooltipText = 'App is shut down';
    }

    if (appPods.deployment状态 === 'DEPLOYING' || appPods.deployment状态 === 'SHUTTING_DOWN') {
        statusColor = 'bg-orange-500';
    }

    if (appPods.deployment状态 === 'DEPLOYED') {
        statusColor = 'bg-green-500';
        statusLabel = 'Ok';
    }

    if (appPods.deployment状态 === 'ERROR') {
        statusColor = 'bg-red-500';
        statusLabel = 'Fehler';
        tooltipText = 'Error during deployment';
    }

    if (appPods.deployment状态 === 'BUILDING') {
        statusColor = 'bg-blue-500';
        statusLabel = 'Build';
        tooltipText = 'App is building';
    }

    if (appPods.deployment状态 === 'UNKNOWN') {
        statusColor = 'bg-gray-400';
        statusLabel = 'Unknown';
        tooltipText = 'Unknown deployment status';
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div class名称="flex items-center gap-2 w-fit">
                    <div class名称={cn("w-3 h-3 rounded-full", statusColor)} />
                    {showLabel && <span class名称="text-xs text-gray-700">{statusLabel}</span>}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    );
}
