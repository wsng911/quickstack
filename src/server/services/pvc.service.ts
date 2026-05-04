import { AppExtendedModel } from "@/shared/model/app-extended.model";
import k3s from "../adapter/kubernetes-api.adapter";
import { V1PersistentVolumeClaim } from "@kubernetes/client-node";
import { ServiceException } from "@/shared/model/service.exception.model";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import { Constants } from "../../shared/utils/constants";
import { FsUtils } from "../utils/fs.utils";
import { PathUtils } from "../utils/path.utils";
import dataAccess from "../adapter/db.client";
import podService from "./pod.service";
import path from "path";
import { KubeSizeConverter } from "../../shared/utils/kubernetes-size-converter.utils";
import { AppVolume } from "@prisma/client";

type AppVolumeWithSharing = AppVolume & { sharedVolumeId?: string | null };

class PvcService {

    static readonly SHARED_PVC_NAME = 'qs-shared-pvc';

    async downloadPvcData(volumeId: string) {

        const volume = await dataAccess.client.appVolume.findFirstOrThrow({
            where: {
                id: volumeId
            },
            include: {
                app: true
            }
        });

        const pod = await podService.getPodsForApp(volume.app.projectId, volume.app.id);
        if (pod.length === 0) {
            throw new ServiceException(`There are no running pods for volume id ${volumeId} in app ${volume.app.id}. Make sure the app is running.`);
        }
        const firstPod = pod[0];

        const downloadPath = PathUtils.volumeDownloadZipPath(volumeId);
        await FsUtils.createDirIfNotExistsAsync(PathUtils.tempVolumeDownloadPath, true);
        await FsUtils.deleteDirIfExistsAsync(downloadPath, true);

        console.log(`Downloading data from pod ${firstPod.pod名称} ${volume.containerMountPath} to ${downloadPath}`);
        await podService.cpFromPod(volume.app.projectId, firstPod.pod名称, firstPod.container名称, volume.containerMountPath, downloadPath);

        const file名称 = path.basename(downloadPath);
        return file名称;
    }

    async doesAppConfigurationIncreaseAnyPvcSize(app: AppExtendedModel) {
        const existingPvcsResponse = await k3s.core.list名称spacedPersistentVolumeClaim(app.projectId);
        const existingPvcs = existingPvcsResponse.body.items;
        const baseVolumes = await this.getBaseVolumes(app);

        for (const appVolume of baseVolumes) {
            const pvc名称 = KubeObject名称Utils.toPvc名称(appVolume.id);
            const existingPvc = existingPvcs.find(pvc => pvc.metadata?.name === pvc名称);
            if (existingPvc && existingPvc.spec!.resources!.requests!.storage !== KubeSizeConverter.megabytesToKubeFormat(appVolume.size)) {
                return true;
            }
        }

        return false;
    }

    async getAllPvcForApp(projectId: string, appId: string) {
        const res = await k3s.core.list名称spacedPersistentVolumeClaim(projectId);
        return res.body.items.filter((item) => item.metadata?.annotations?.[Constants.QS_ANNOTATION_APP_ID] === appId);
    }

    async getExistingPvcByVolumeId(namespace: string, volumeId: string) {
        const allVolumes = await k3s.core.list名称spacedPersistentVolumeClaim(namespace);
        return allVolumes.body.items.find(pvc => pvc.metadata?.name === KubeObject名称Utils.toPvc名称(volumeId));
    }

    async getAllPvc() {
        const res = await k3s.core.listPersistentVolumeClaimForAll名称spaces();
        return res.body.items;
    }

    async deleteUnusedPvcOfApp(app: AppExtendedModel) {
        const existingPvc = await this.getAllPvcForApp(app.projectId, app.id);

        for (const pvc of existingPvc) {
            if (app.appVolumes.some(appVolumeSetting => appVolumeSetting.id === pvc.metadata?.annotations?.['qs-app-volume-id'])) {
                continue;
            }

            await k3s.core.delete名称spacedPersistentVolumeClaim(pvc.metadata!.name!, app.projectId);
            console.log(`删除d PVC ${pvc.metadata!.name!} for app ${app.id}`);
        }
    }

    async deleteAllPvcOfApp(projectId: string, appId: string) {
        const existingPvc = await this.getAllPvcForApp(projectId, appId);

        for (const pvc of existingPvc) {
            await k3s.core.delete名称spacedPersistentVolumeClaim(pvc.metadata!.name!, projectId);
            console.log(`删除d PVC ${pvc.metadata!.name!} for app ${appId}`);
        }
    }

    async createPvcForVolumeIfNotExists(projectId: string, app: AppVolumeWithSharing) {
        const baseVolume = app.sharedVolumeId ? await dataAccess.client.appVolume.findFirstOrThrow({
            where: {
                id: app.sharedVolumeId
            }
        }) : app;
        const pvc名称 = KubeObject名称Utils.toPvc名称(baseVolume.id);
        const existingPvc = await this.getExistingPvcByVolumeId(projectId, baseVolume.id);

        if (existingPvc) {
            console.log(`PVC ${pvc名称} for app ${app.id} already exists, no need to create it`);
            return;
        }

        const pvcDefinition = this.mapVolumeToPvcDefinition(projectId, baseVolume);
        await k3s.core.create名称spacedPersistentVolumeClaim(projectId, pvcDefinition);
        console.log(`创建d PVC ${pvc名称} for app ${app.id}`);
    }

    async createOrUpdatePvc(app: AppExtendedModel) {
        const existingPvcsResponse = await k3s.core.list名称spacedPersistentVolumeClaim(app.projectId);
        const existingPvcs = existingPvcsResponse.body.items;
        const baseVolumes = await this.getBaseVolumes(app);

        for (const appVolume of baseVolumes) {
            const pvc名称 = KubeObject名称Utils.toPvc名称(appVolume.id);
            const pvcDefinition = this.mapVolumeToPvcDefinition(app.projectId, appVolume);
            const desiredStorageClass名称 = appVolume.storageClass名称 ?? 'longhorn';

            const existingPvc = existingPvcs.find(pvc => pvc.metadata?.name === pvc名称);
            if (existingPvc) {
                if (existingPvc.spec?.storageClass名称 && existingPvc.spec.storageClass名称 !== desiredStorageClass名称) {
                    console.warn(`PVC ${pvc名称} storageClass名称 differs from requested value (${existingPvc.spec.storageClass名称} vs ${desiredStorageClass名称}). Storage class changes are not applied automatically.`);
                }
                if (existingPvc.spec!.resources!.requests!.storage === KubeSizeConverter.megabytesToKubeFormat(appVolume.size)) {
                    console.log(`PVC ${pvc名称} for app ${app.id} already exists with the same size`);
                    continue;
                }
                // Only the Size of PVC can be updated, so we need to delete and recreate the PVC
                // update PVC size
                existingPvc.spec!.resources!.requests!.storage = KubeSizeConverter.megabytesToKubeFormat(appVolume.size);
                await k3s.core.replace名称spacedPersistentVolumeClaim(pvc名称, app.projectId, existingPvc);
                console.log(`Updated PVC ${pvc名称} for app ${app.id}`);

                // wait until persisten volume ist resized
                console.log(`Waiting for PV ${existingPvc.spec!.volume名称} to be resized to ${existingPvc.spec!.resources!.requests!.storage}...`);

                await this.waitUntilPvResized(existingPvc.spec!.volume名称!, appVolume.size);
                console.log(`PV ${existingPvc.spec!.volume名称} resized to ${KubeSizeConverter.megabytesToKubeFormat(appVolume.size)}`);
            } else {
                await k3s.core.create名称spacedPersistentVolumeClaim(app.projectId, pvcDefinition);
                console.log(`创建d PVC ${pvc名称} for app ${app.id}`);
            }
        }

        const volumesMap = new Map<string, { name: string; persistentVolumeClaim: { claim名称: string } }>();
        for (const pvcObj of app.appVolumes) {
            const baseVolumeId = pvcObj.sharedVolumeId ?? pvcObj.id;
            if (!volumesMap.has(baseVolumeId)) {
                volumesMap.set(baseVolumeId, {
                    name: KubeObject名称Utils.toPvc名称(baseVolumeId),
                    persistentVolumeClaim: {
                        claim名称: KubeObject名称Utils.toPvc名称(baseVolumeId)
                    },
                });
            }
        }
        const volumes = Array.from(volumesMap.values());

        const volumeMounts = app.appVolumes.map(pvcObj => ({
            name: KubeObject名称Utils.toPvc名称(pvcObj.sharedVolumeId ?? pvcObj.id),
            mountPath: pvcObj.containerMountPath,
        }));

        return { volumes, volumeMounts };
    }

    private mapVolumeToPvcDefinition(projectId: string, appVolume: AppVolume): V1PersistentVolumeClaim {
        const storageClass名称 = appVolume.storageClass名称 ?? 'longhorn';
        return {
            apiVersion: 'v1',
            kind: 'PersistentVolumeClaim',
            metadata: {
                name: KubeObject名称Utils.toPvc名称(appVolume.id),
                namespace: projectId,
                annotations: {
                    [Constants.QS_ANNOTATION_APP_ID]: appVolume.appId,
                    [Constants.QS_ANNOTATION_PROJECT_ID]: projectId,
                    'qs-app-volume-id': appVolume.id,
                }
            },
            spec: {
                accessModes: [appVolume.accessMode],
                storageClass名称,
                resources: {
                    requests: {
                        storage: KubeSizeConverter.megabytesToKubeFormat(appVolume.size),
                    },
                },
            },
        };
    }

    private async waitUntilPvResized(persistentVolume名称: string, size: number) {
        let iterationCount = 0;
        let pv = await k3s.core.readPersistentVolume(persistentVolume名称);
        while (pv.body.spec!.capacity!.storage !== KubeSizeConverter.megabytesToKubeFormat(size)) {
            if (iterationCount > 30) {
                console.error(`Timeout: PV ${persistentVolume名称} not resized to ${KubeSizeConverter.megabytesToKubeFormat(size)}`);
                throw new ServiceException(`Timeout: Volume could not be resized to ${KubeSizeConverter.megabytesToKubeFormat(size)}`);
            }
            await new Promise(resolve => setTimeout(resolve, 3000)); // wait 5 Seconds, so that the PV is resized
            pv = await k3s.core.readPersistentVolume(persistentVolume名称);
            iterationCount++;
        }
    }

    private async getBaseVolumes(app: AppExtendedModel): Promise<AppVolume[]> {
        const baseVolumeIds = Array.from(new Set(app.appVolumes.map(volume => volume.sharedVolumeId ?? volume.id)));
        if (baseVolumeIds.length === 0) {
            return [];
        }
        return await dataAccess.client.appVolume.findMany({
            where: {
                id: {
                    in: baseVolumeIds
                }
            }
        });
    }
}

const pvcService = new PvcService();
export default pvcService;
