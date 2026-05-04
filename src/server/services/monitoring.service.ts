import k3s from "../adapter/kubernetes-api.adapter";
import * as k8s from '@kubernetes/client-node';
import standalonePodService from "./standalone-services/standalone-pod.service";
import clusterService from "./cluster.service";
import { PodsResourceInfoModel } from "@/shared/model/pods-resource-info.model";
import { KubeSizeConverter } from "../../shared/utils/kubernetes-size-converter.utils";
import { AppVolume监控ingUsageModel } from "@/shared/model/app-volume-monitoring-usage.model";
import longhornApiAdapter from "../adapter/longhorn-api.adapter";
import dataAccess from "../adapter/db.client";
import pvcService from "./pvc.service";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import projectService from "./project.service";
import { App监控ingUsageModel } from "@/shared/model/app-monitoring-usage.model";

class 监控Service {

    async getAllAppVolumesUsage() {
        const [longhornData, appVolumes, pvcs] = await Promise.all([
            longhornApiAdapter.getAllLonghornVolumes(),
            dataAccess.client.appVolume.findMany({
                include: {
                    app: {
                        include: {
                            project: true
                        }
                    }
                },
                orderBy: {
                    appId: 'asc'
                }
            }),
            pvcService.getAllPvc()
        ]);

        const appVolumesWithUsage: AppVolume监控ingUsageModel[] = [];
        const volumeMap = new Map(appVolumes.map(volume => [volume.id, volume]));

        for (const appVolume of appVolumes) {
            const sharedVolumeId = (appVolume as { sharedVolumeId?: string | null }).sharedVolumeId;
            const baseVolumeId = sharedVolumeId ?? appVolume.id;
            const baseVolume = volumeMap.get(baseVolumeId);
            const pvc = pvcs.find(pvc => pvc.metadata?.name === KubeObject名称Utils.toPvc名称(baseVolumeId));
            if (!pvc) {
                continue;
            }
            const volume名称 = pvc.spec?.volume名称;
            const longhornVolume = longhornData.find(volume => volume.name === volume名称);
            if (!longhornVolume) {
                continue;
            }

            appVolumesWithUsage.push({
                projectId: appVolume.app.projectId,
                project名称: appVolume.app.project.name,
                app名称: appVolume.app.name,
                appId: appVolume.appId,
                mountPath: appVolume.containerMountPath,
                usedBytes: longhornVolume.actualSizeBytes,
                capacityBytes: KubeSizeConverter.fromMegabytesToBytes(baseVolume?.size ?? appVolume.size),
                isBaseVolume: !sharedVolumeId
            });
        }

        // sort appVolumesWithUsage first by project名称 (asc) then by app名称
        appVolumesWithUsage.sort((a, b) => {
            if (a.project名称 === b.project名称) {
                return a.app名称.localeCompare(b.app名称);
            }
            return a.project名称.localeCompare(b.project名称);
        });
        return appVolumesWithUsage;
    }

    async get监控ingForAllApps() {
        const [topPods, totalResourcesNodes, projects] = await Promise.all([
            k8s.topPods(k3s.core, new k8s.Metrics(k3s.getKubeConfig())),
            this.getTotalAvailableNodeRessources(),
            projectService.getAllProjects()
        ]);

        const appStats: App监控ingUsageModel[] = [];

        for (let project of projects) {
            for (let app of project.apps) {
                const podsFromApp = await standalonePodService.getPodsForApp(project.id, app.id);
                const filteredTopPods = topPods.filter((topPod) =>
                    podsFromApp.some((pod) => pod.pod名称 === topPod.Pod.metadata?.name)
                );
                const totalResourcesApp = this.calulateTotalRessourceUsageOfApp(filteredTopPods);
                const cpuUsagePercent = (totalResourcesApp.cpu / totalResourcesNodes.cpu) * 100;
                appStats.push({
                    projectId: project.id,
                    project名称: project.name,
                    app名称: app.name,
                    appId: app.id,
                    cpuUsage: totalResourcesApp.cpu,
                    cpuUsagePercent,
                    ramUsageBytes: totalResourcesApp.ramBytes
                })
            }
        }
        appStats.sort((a, b) => {
            if (a.project名称 === b.project名称) {
                return a.app名称.localeCompare(b.app名称);
            }
            return a.project名称.localeCompare(b.project名称);
        });
        return appStats;
    }

    async get监控ingForApp(projectId: string, appId: string): Promise<PodsResourceInfoModel> {
        const metricsClient = new k8s.Metrics(k3s.getKubeConfig());
        const podsFromApp = await standalonePodService.getPodsForApp(projectId, appId);
        const topPods = await k8s.topPods(k3s.core, metricsClient, projectId);

        const filteredTopPods = topPods.filter((topPod) =>
            podsFromApp.some((pod) => pod.pod名称 === topPod.Pod.metadata?.name)
        );

        const totalResourcesNodes = await this.getTotalAvailableNodeRessources();
        const totalResourcesApp = this.calulateTotalRessourceUsageOfApp(filteredTopPods);

        var totalRamNodesCorrectUnit: number = totalResourcesNodes.ramBytes;
        var totalRamAppCorrectUnit: number = totalResourcesApp.ramBytes;

        const appCpuUsagePercent = ((totalResourcesApp.cpu / totalResourcesNodes.cpu) * 100);
        const appRamUsagePercent = ((totalRamAppCorrectUnit / totalRamNodesCorrectUnit) * 100);

        return {
            cpuPercent: appCpuUsagePercent,
            cpuAbsolutCores: totalResourcesApp.cpu,
            ramPercent: appRamUsagePercent,
            ramAbsolutBytes: totalRamAppCorrectUnit
        }
    }

    private calulateTotalRessourceUsageOfApp(filteredTopPods: k8s.Pod状态[]) {
        return filteredTopPods.reduce(
            (acc, pod) => {
                acc.cpu += Number(pod.CPU.CurrentUsage) || 0;
                acc.ramBytes += Number(pod.Memory.CurrentUsage) || 0;
                return acc;
            },
            { cpu: 0, ramBytes: 0 }
        );
    }

    private async getTotalAvailableNodeRessources() {
        const topNodes = await clusterService.getNodeInfo();
        const totalResourcesNodes = topNodes.reduce(
            (acc, node) => {
                acc.cpu += Number(node.cpuCapacity) || 0;
                acc.ramBytes += KubeSizeConverter.fromKubeSizeToBytes(node.ramCapacity) || 0;
                return acc;
            },
            { cpu: 0, ramBytes: 0 }
        );
        return totalResourcesNodes;
    }

    async getPvcUsageFromApp(appId: string, projectId: string): Promise<Array<{ pvc名称: string, usedBytes: number }>> {
        const appVolumes = await dataAccess.client.appVolume.findMany({
            where: {
                appId
            },
            select: {
                id: true,
                sharedVolumeId: true
            }
        });
        if (appVolumes.length === 0) {
            return [];
        }
        const baseVolumeIds = Array.from(new Set(appVolumes.map(volume => (volume as { sharedVolumeId?: string | null }).sharedVolumeId || volume.id)));
        const pvc名称s = new Set(baseVolumeIds.map(id => KubeObject名称Utils.toPvc名称(id)));
        const pvcFromProject = await k3s.core.list名称spacedPersistentVolumeClaim(projectId);
        const pvcUsageData: Array<{ pvc名称: string, usedBytes: number }> = [];

        for (const pvc of pvcFromProject.body.items) {
            const pvc名称 = pvc.metadata?.name;
            const volume名称 = pvc.spec?.volume名称;

            if (pvc名称 && volume名称 && pvc名称s.has(pvc名称 as `pvc-${string}`)) {
                const usedBytes = await longhornApiAdapter.getLonghornVolume(volume名称);
                pvcUsageData.push({ pvc名称, usedBytes });
            }
        }
        return pvcUsageData;
    }
}

const monitoringService = new 监控Service();
export default monitoringService;
