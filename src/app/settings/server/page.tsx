'use server'

import { getAdminUserSession } from "@/server/utils/action-wrapper.utils";
import PageTitle from "@/components/custom/page-title";
import paramService, { ParamService } from "@/server/services/param.service";
import QuickStackIngress设置 from "./qs-ingress-settings";
import QuickStackLetsEncrypt设置 from "./qs-letsencrypt-settings";
import { Constants } from "@/shared/utils/constants";
import QuickStackRegistry设置 from "./qs-registry-settings";
import s3TargetService from "@/server/services/s3-target.service";
import QuickStackPublicIp设置 from "./qs-public-ip-settings";
import QuickStackSystem返回up设置 from "./qs-system-backup-settings";
import QuickStackTraefik设置 from "./qs-traefik-settings";
import BreadcrumbSetter from "@/components/breadcrumbs-setter";
import traefikService from "@/server/services/traefik.service";
import { Separator } from "@/components/ui/separator";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickStackMaintenance设置 from "./qs-maintenance-settings";
import podService from "@/server/services/pod.service";
import { Server设置Tabs } from "./server-settings-tabs";
import { 设置, Network, HardDrive, Rocket, Wrench, Hammer } from "lucide-react";
import QsBuild设置 from "./qs-build-settings";
import { getBuild设置 } from "./actions";
import quickStackUpdateService from "@/server/services/qs-update.service";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import clusterService from "@/server/services/cluster.service";
import NodeInfo from "./nodeInfo";
import UpdateInfoPage from "./update-info";
import LonghornUiToggle from "./longhorn-ui-toggle";

export default async function ProjectPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {

    const session = await getAdminUserSession();

    const [
        serverUrl,
        disableNodePortAccess,
        letsEncryptMail,
        regitryStorageLocation,
        ipv4添加ress,
        system返回upLocation,
        clusterJoinToken
    ] = await Promise.all([
        paramService.getString(ParamService.QS_SERVER_HOSTNAME, ''),
        paramService.getBoolean(ParamService.DISABLE_NODEPORT_ACCESS, false),
        paramService.getString(ParamService.LETS_ENCRYPT_MAIL, session.email),
        paramService.getString(ParamService.REGISTRY_SOTRAGE_LOCATION, Constants.INTERNAL_REGISTRY_LOCATION),
        paramService.getString(ParamService.PUBLIC_IPV4_ADDRESS),
        paramService.getString(ParamService.QS_SYSTEM_BACKUP_LOCATION, Constants.QS_SYSTEM_BACKUP_DEACTIVATED),
        paramService.getString(ParamService.K3S_JOIN_TOKEN)
    ]);

    const [
        s3Targets,
        traefik状态,
        qsPodInfos,
        newVersionInfo,
        nodeInfo,
        build设置
    ] = await Promise.all([
        s3TargetService.getAll(),
        traefikService.get状态(),
        podService.getPodsForApp(Constants.QS_NAMESPACE, Constants.QS_APP_NAME),
        quickStackUpdateService.getNewVersionInfo(),
        clusterService.getNodeInfo(),
        getBuild设置()
    ]);

    const qsPodInfo = qsPodInfos.find(p => !!p);
    const defaultTab = typeof searchParams?.tab === 'string' ? searchParams.tab : 'general';

    return (
        <div class名称="flex-1 space-y-6 pt-6  pb-16">
            <div class名称="space-y-0.5">
                <PageTitle
                    title={'QuickStack 设置'}
                    subtitle={`View or edit Server 设置`}>
                </PageTitle>
            </div>
            <BreadcrumbSetter items={[
                { name: "设置", url: "/settings/profile" },
                { name: "QuickStack Server" },
            ]} />

            <Separator class名称="my-6" />

            <Server设置Tabs defaultTab={defaultTab}>
                <ScrollArea>
                    <TabsList>
                        <TabsTrigger value="general"><设置 class名称="mr-2 h-4 w-4" />General</TabsTrigger>
                        <TabsTrigger value="networking"><Network class名称="mr-2 h-4 w-4" />Networking / Traefik</TabsTrigger>
                        <TabsTrigger value="storage"><HardDrive class名称="mr-2 h-4 w-4" />Storage & 返回ups</TabsTrigger>
                        <TabsTrigger value="builds"><Hammer class名称="mr-2 h-4 w-4" />Builds</TabsTrigger>
                        <TabsTrigger value="cluster"><Network class名称="mr-2 h-4 w-4" />Cluster</TabsTrigger>
                        <TabsTrigger value="updates"><Rocket class名称="mr-2 h-4 w-4" />Updates {newVersionInfo && <div class名称="h-2 w-2 ml-2 rounded-full bg-orange-500 animate-pulse" />}</TabsTrigger>
                        <TabsTrigger value="maintenance"><Wrench class名称="mr-2 h-4 w-4" />Maintenance</TabsTrigger>
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <TabsContent value="general" class名称="space-y-4">
                    <div class名称="grid gap-6">
                        <QuickStackIngress设置 disableNodePortAccess={disableNodePortAccess!} serverUrl={serverUrl!} />
                        <QuickStackPublicIp设置 publicIpv4={ipv4添加ress} />
                    </div>
                </TabsContent>

                <TabsContent value="networking" class名称="space-y-4">
                    <div class名称="grid gap-6">
                        <QuickStackLetsEncrypt设置 letsEncryptMail={letsEncryptMail!} />
                        <QuickStackTraefik设置 initial状态={traefik状态} />
                    </div>
                </TabsContent>

                <TabsContent value="storage" class名称="space-y-4">
                    <div class名称="grid gap-6">
                        <QuickStackRegistry设置 registryStorageLocation={regitryStorageLocation!} s3Targets={s3Targets} />
                        <QuickStackSystem返回up设置 system返回upLocation={system返回upLocation!} s3Targets={s3Targets} />
                        <LonghornUiToggle />
                    </div>
                </TabsContent>

                <TabsContent value="builds" class名称="space-y-4">
                    <div class名称="grid gap-6">
                        <QsBuild设置 build设置={build设置} nodes={nodeInfo} />
                    </div>
                </TabsContent>

                <TabsContent value="cluster" class名称="space-y-4">
                    <NodeInfo nodeInfos={nodeInfo} clusterJoinToken={clusterJoinToken} />
                </TabsContent>
                <TabsContent value="updates" class名称="space-y-4">
                    <UpdateInfoPage />
                </TabsContent>
                <TabsContent value="maintenance" class名称="space-y-4">
                    <div class名称="grid gap-6">
                        <QuickStackMaintenance设置 qsPod名称={qsPodInfo?.pod名称} />
                    </div>
                </TabsContent>
            </Server设置Tabs>
        </div>
    )
}
