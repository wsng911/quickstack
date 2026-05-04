'use client'

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import GeneralAppRateLimits from "./general/app-rate-limits";
import GeneralAppSource from "./general/app-source";
import GeneralAppContainerConfig from "./general/app-container-config";
import Env编辑 from "./environment/env-edit";
import { S3Target } from "@prisma/client";
import DomainsList from "./domains/domains";
import StorageList from "./volumes/storages";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import BuildsTab from "./overview/deployments";
import Logs from "./overview/logs";
import 监控ingTab from "./overview/monitoring-app";
import InternalHostnames from "./domains/ports-and-internal-hostnames";
import NodePortsCard from "./domains/node-ports";
import FileMount from "./volumes/file-mount";
import WebhookDeploymentInfo from "./overview/webhook-deployment";
import DbCredentials from "./credentials/db-crendentials";
import Volume返回upList from "./volumes/volume-backup";
import { Volume返回upExtendedModel } from "@/shared/model/volume-backup-extended.model";
import BasicAuth from "./advanced/basic-auth";
import NetworkPolicy from "./advanced/network-policy";
import HealthCheck设置 from "./advanced/health-check-settings";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import DbToolsCard from "./credentials/db-tools";
import { RolePermissionEnum } from "@/shared/model/role-extended.model.ts";
import { NodeInfoModel } from "@/shared/model/node-info.model";
import { Eye, Key, 设置, Zap, Globe, HardDrive, Cog } from "lucide-react";
import { AppSourceUtils } from "@/frontend/utils/app-source.utils";

export default function AppTabs({
    app,
    role,
    tab名称,
    s3Targets,
    volume返回ups,
    nodesInfo,
    gitSshPublicKey,
}: {
    app: AppExtendedModel;
    role: RolePermissionEnum;
    tab名称: string;
    s3Targets: S3Target[];
    volume返回ups: Volume返回upExtendedModel[];
    nodesInfo: NodeInfoModel[];
    gitSshPublicKey?: string;
}) {
    const router = useRouter();
    const readonly = role !== RolePermissionEnum.READWRITE;
    const appSourceIsConfigured = AppSourceUtils.isConfiguredSource(app);
    const openTab = (tab名称: string) => {
        router.push(`/project/app/${app.id}?tab名称=${tab名称}`);
    }

    if (!appSourceIsConfigured) {
        return (
            <GeneralAppSource readonly={readonly} app={app} gitSshPublicKey={gitSshPublicKey} />
        )
    }

    return (
        <Tabs defaultValue="general" value={tab名称} onValueChange={(newTab) => openTab(newTab)} class名称="space-y-4">
            <ScrollArea>
                <TabsList>
                    <TabsTrigger value="overview"><Eye class名称="mr-2 h-4 w-4" />概览</TabsTrigger>
                    {app.appType !== 'APP' && <TabsTrigger value="credentials"><Key class名称="mr-2 h-4 w-4" />Credentials</TabsTrigger>}
                    <TabsTrigger value="general"><设置 class名称="mr-2 h-4 w-4" />General</TabsTrigger>
                    <TabsTrigger value="environment"><Zap class名称="mr-2 h-4 w-4" />Environment</TabsTrigger>
                    <TabsTrigger value="domains"><Globe class名称="mr-2 h-4 w-4" />Domains</TabsTrigger>
                    <TabsTrigger value="storage"><HardDrive class名称="mr-2 h-4 w-4" />Storage</TabsTrigger>
                    <TabsTrigger value="advanced"><Cog class名称="mr-2 h-4 w-4" />Advanced</TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <TabsContent value="overview" class名称="grid grid-cols-1 3xl:grid-cols-2 gap-4">
                <监控ingTab app={app} />
                <Logs role={role} app={app} />
                <BuildsTab role={role} app={app} />
                <WebhookDeploymentInfo role={role} app={app} />
            </TabsContent>
            {app.appType !== 'APP' && <TabsContent value="credentials" class名称="space-y-4">
                {role === RolePermissionEnum.READWRITE && <DbToolsCard app={app} />}
                <DbCredentials app={app} />
            </TabsContent>}
            <TabsContent value="general" class名称="space-y-4">
                <GeneralAppSource readonly={readonly} app={app} gitSshPublicKey={gitSshPublicKey} />
                <GeneralAppRateLimits readonly={readonly} app={app} />
                <GeneralAppContainerConfig readonly={readonly} app={app} />
            </TabsContent>
            <TabsContent value="environment" class名称="space-y-4">
                <Env编辑 readonly={readonly} app={app} />
            </TabsContent>
            <TabsContent value="domains" class名称="space-y-4">
                <DomainsList readonly={readonly} app={app} />
                <InternalHostnames readonly={readonly} app={app} />
                <NodePortsCard readonly={readonly} app={app} />
            </TabsContent>
            <TabsContent value="storage" class名称="space-y-4">
                <StorageList readonly={readonly} app={app} nodesInfo={nodesInfo} />
                <FileMount readonly={readonly} app={app} />
                <Volume返回upList
                    readonly={readonly}
                    app={app}
                    s3Targets={s3Targets}
                    volume返回ups={volume返回ups} />
            </TabsContent>
            <TabsContent value="advanced" class名称="space-y-4">
                <BasicAuth readonly={readonly} app={app} />
                <NetworkPolicy readonly={readonly} app={app} />
                <HealthCheck设置 readonly={readonly} app={app} />
            </TabsContent>
        </Tabs>
    )
}
