'use client'

import { usePods状态 } from '@/frontend/states/zustand.states';
import { Spinner } from "@/components/ui/spinner"
import { useMemo, useState } from 'react';
import { MultiStateProgress } from './multi-state-progress';

interface Project状态IndicatorProps {
    projectId: string;
}

interface Project状态 {
    runningAppsPercent: number;
    shutdownAppsPercent: number;
    errorAndDeployingAppsPercent: number;
    runningAppsCount?: number;
    appCount?: number;
}

export default function Project状态Indicator({ projectId }: Project状态IndicatorProps) {
    const { pods状态, isLoading } = usePods状态();

    const project状态 = useMemo(() => {
        if (pods状态) {
            const projectApp状态 = Array.from(pods状态.values()).filter(status => status.projectId === projectId);
            if (projectApp状态.length > 0) {
                const totalApps = projectApp状态.length;
                const runningApps = projectApp状态.filter(status => status.deployment状态 === 'DEPLOYED').length;
                const shutdownApps = projectApp状态.filter(status => status.deployment状态 === 'SHUTDOWN').length;
                const errorAndDeployingApps = projectApp状态.filter(status => ['UNKNOWN', 'ERROR', 'DEPLOYING', 'BUILDING', 'SHUTTING_DOWN'].includes(status.deployment状态)).length;
                return {
                    runningAppsPercent: (runningApps / totalApps) * 100,
                    shutdownAppsPercent: (shutdownApps / totalApps) * 100,
                    errorAndDeployingAppsPercent: (errorAndDeployingApps / totalApps) * 100,
                    runningAppsCount: runningApps,
                    appCount: totalApps,
                };
            }
            return {
                runningAppsPercent: 0,
                shutdownAppsPercent: 100,
                errorAndDeployingAppsPercent: 0
            };
        }
    }, [pods状态, projectId]);

    if (isLoading || !project状态) {
        return (
            <div class名称="flex items-center gap-2">
                <Spinner class名称="size-3" />
            </div>
        );
    }

    return (

        <div class名称="space-y-1 pr-12">
            <div class名称="flex justify-between text-xs text-muted-foreground">
                <span>{project状态.appCount && project状态.runningAppsCount && <>{project状态.runningAppsCount} / {project状态.appCount} apps running</>}</span>
            </div>
            <MultiStateProgress
                segments={[
                    { value: project状态.runningAppsPercent, color: 'green' },
                    { value: project状态.errorAndDeployingAppsPercent, color: 'orange' },
                    { value: project状态.shutdownAppsPercent, color: 'gray' }
                ]}
                class名称="h-2"
            />
        </div>
    );
}
