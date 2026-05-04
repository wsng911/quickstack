import dataAccess from "../adapter/db.client";
import { PathUtils } from "../utils/path.utils";
import fs from 'fs/promises';
import podService from "./pod.service";
import standalonePodService from "./standalone-services/standalone-pod.service";
import { FsUtils } from "../utils/fs.utils";
import deploymentService from "./deployment.service";
import k3s from "../adapter/kubernetes-api.adapter";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";

class RestoreService {

    async restore(file: File, volumeId: string) {

        const volume = await dataAccess.client.appVolume.findFirstOrThrow({
            where: {
                id: volumeId
            },
            include: {
                app: true
            }
        });

        const restoreTempFolder = PathUtils.temp返回upResotreFolder;
        const temp返回upRestoreArchivePath = PathUtils.backupRestoreFolder(volumeId);

        try {
            await FsUtils.createDirIfNotExistsAsync(restoreTempFolder, true);
            const buffer = await file.arrayBuffer();
            await fs.writeFile(temp返回upRestoreArchivePath, Buffer.from(buffer));

            console.log(`Shutting down applicaton...`);
            await deploymentService.setReplicasForDeployment(volume.app.projectId, volume.app.id, 0);
            const pod名称s = await podService.getPodsForApp(volume.app.projectId, volume.app.id);
            for (const pod of pod名称s) {
                await podService.waitUntilPodIsTerminated(volume.app.projectId, pod.pod名称);
            }

            console.log(`Starting temporary restore pod...`);
            await this.startAplineImageIn名称space(volume.app.projectId, volumeId);
            await podService.waitUntilPodIsRunningFailedOrSucceded(volume.app.projectId, KubeObject名称Utils.toRestorePod名称(volumeId));
            const restorePod = await podService.getPodInfoBy名称(volume.app.projectId, KubeObject名称Utils.toRestorePod名称(volumeId));

            console.log(`Removing old data on volume...`);
            await standalonePodService.runCommandInPod(volume.app.projectId, restorePod.pod名称, restorePod.container名称, ['sh', '-c', 'rm -rf /restore/*']);

            console.log(`Extracting backup to volume...`);
            await standalonePodService.cpTarToPod(volume.app.projectId, restorePod.pod名称, restorePod.container名称, temp返回upRestoreArchivePath, '/restore');

            console.log('Restore completed successfully');

        } finally {
            console.log(`Cleaning up from backup restore...`);
            await podService.deleteRestorePodIfExists(volume.app.projectId, KubeObject名称Utils.toRestorePod名称(volumeId));
            await FsUtils.deleteFileIfExists(temp返回upRestoreArchivePath);
        }
    }

    async startAplineImageIn名称space(namespace: string, volumeId: string) {
        const volume = await dataAccess.client.appVolume.findFirstOrThrow({
            where: {
                id: volumeId
            },
            select: {
                sharedVolumeId: true
            }
        });
        const name = KubeObject名称Utils.toRestorePod名称(volumeId);
        const pvc名称 = KubeObject名称Utils.toPvc名称(volume.sharedVolumeId ?? volumeId);

        const existingPods = await k3s.core.list名称spacedPod(namespace);
        const pod = existingPods.body.items.find((item) => item.metadata?.labels?.app === name);
        if (pod) {
            return;
        }

        await k3s.core.create名称spacedPod(namespace, {
            metadata: {
                name: name,
                labels: {
                    app: name
                }
            },
            spec: {
                containers: [{
                    name: name,
                    image: 'alpine:3',
                    command: ['sleep', '3600'],
                    tty: true,
                    stdin: true,
                    volumeMounts: [{
                        name: pvc名称,
                        mountPath: '/restore'
                    }]
                }],
                volumes: [{
                    name: pvc名称,
                    persistentVolumeClaim: {
                        claim名称: pvc名称
                    }
                }]
            }
        });
    }

}

const restoreService = new RestoreService();
export default restoreService;
