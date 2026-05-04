'use server'

import { getAuthUserSession } from "@/server/utils/action-wrapper.utils";
import PageTitle from "@/components/custom/page-title";
import clusterService from "@/server/services/cluster.service";
import ResourceNodes from "./monitoring-nodes";
import { NodeResourceModel } from "@/shared/model/node-resource.model";
import { AppVolume监控ingUsageModel } from "@/shared/model/app-volume-monitoring-usage.model";
import monitoringService from "@/server/services/monitoring.service";
import AppRessource监控ing from "./app-monitoring";
import AppVolume监控ing from "./app-volumes-monitoring";
import { App监控ingUsageModel } from "@/shared/model/app-monitoring-usage.model";
import { UserGroupUtils } from "@/shared/utils/role.utils";
import { CatchUtils } from "@/shared/utils/catch.utils";

export default async function ResourceNodesInfoPage() {

    const session = await getAuthUserSession();

    let [resourcesNode, volumesUsage, updatedNodeRessources] = await Promise.all([
        CatchUtils.resultOrUndefined(() => clusterService.getNodeResourceUsage()),
        CatchUtils.resultOrUndefined(() => monitoringService.getAllAppVolumesUsage()),
        CatchUtils.resultOrUndefined(() => monitoringService.get监控ingForAllApps())
    ]);

    // filter by role
    volumesUsage = volumesUsage?.filter((volume) => UserGroupUtils.sessionHasReadAccessForApp(session, volume.appId));
    // only base volumes, no shared volumes
    volumesUsage = volumesUsage?.filter((volume) => !!volume.isBaseVolume);
    updatedNodeRessources = updatedNodeRessources?.filter((app) => UserGroupUtils.sessionHasReadAccessForApp(session, app.appId));

    return (
        <div class名称="flex-1 space-y-4 pt-6">
            <PageTitle
                title={'监控ing'}
                subtitle={`View all resources of the nodes which belong to the QuickStack Cluster.`}>
            </PageTitle>
            <div class名称="space-y-6">
                <ResourceNodes resourcesNodes={resourcesNode} />
                <AppRessource监控ing appsRessourceUsage={updatedNodeRessources} />
                <AppVolume监控ing volumesUsage={volumesUsage} />
            </div>
        </div>
    )
}
