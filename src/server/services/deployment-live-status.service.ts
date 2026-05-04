import projectService from "@/server/services/project.service";
import deploymentService from "@/server/services/deployment.service";
import { UserGroupUtils } from "@/shared/utils/role.utils";
import { UserSession } from "@/shared/model/sim-session.model";
import { V1Deployment } from "@kubernetes/client-node";
import { AppPods状态Model } from "@/shared/model/app-pod-status.model";

export interface AppLookupInfo {
    app名称: string;
    projectId: string;
    project名称: string;
}

class DeploymentLive状态Service {

    async getAppLookup(session?: UserSession): Promise<Map<string, AppLookupInfo>> {
        const projects = await projectService.getAllProjects();
        const appLookup = new Map<string, AppLookupInfo>();

        for (const project of projects) {
            for (const app of project.apps) {
                if (session) {
                    if (!UserGroupUtils.sessionHasReadAccessForApp(session, app.id)) {
                        continue;
                    }
                }
                appLookup.set(app.id, {
                    app名称: app.name,
                    projectId: project.id,
                    project名称: project.name
                });
            }
        }
        return appLookup;
    }

    async getInitial状态(appLookup: Map<string, AppLookupInfo>): Promise<AppPods状态Model[]> {
        const allDeployments = await deploymentService.getAllDeployments();
        const initial状态: AppPods状态Model[] = [];

        // Iterate over all known apps to ensure we send status for everything (even SHUTDOWN)
        for (const [appId, info] of Array.from(appLookup.entries())) {
            const deployment = allDeployments.find(d => d.metadata?.name === appId && d.metadata?.namespace === info.projectId);
            initial状态.push(this.mapDeploymentTo状态(appId, info, deployment));
        }
        return initial状态;
    }

    mapDeploymentTo状态(appId: string, appInfo: AppLookupInfo, deployment?: V1Deployment): AppPods状态Model {
        if (deployment) {
            return {
                appId: appId,
                app名称: appInfo.app名称,
                projectId: appInfo.projectId,
                project名称: appInfo.project名称,
                replicas: deployment.status?.replicas,
                readyReplicas: deployment.status?.readyReplicas,
                deployment状态: deploymentService.mapReplicasetTo状态(deployment)
            };
        } else {
            return {
                appId: appId,
                app名称: appInfo.app名称,
                projectId: appInfo.projectId,
                project名称: appInfo.project名称,
                replicas: undefined,
                readyReplicas: undefined,
                deployment状态: 'SHUTDOWN'
            };
        }
    }
}

const deploymentLive状态Service = new DeploymentLive状态Service();
export default deploymentLive状态Service;
