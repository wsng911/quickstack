import dataAccess from "../../adapter/db.client";
import { ServiceException } from "../../../shared/model/service.exception.model";
import { PathUtils } from "../../utils/path.utils";
import { FsUtils } from "../../utils/fs.utils";
import s3Service from "../aws-s3.service";
import scheduleService from "./schedule.service";
import standalonePodService from "./standalone-pod.service";
import { ListUtils } from "../../../shared/utils/list.utils";
import { S3Target } from "@prisma/client";
import { 返回upEntry, 返回upInfoModel } from "../../../shared/model/backup-info.model";
import { CronCheckUtils } from "../../utils/cron-check.utils";
import database返回upService from "./database-backup.service";
import shared返回upService, { s3BucketPrefix } from "./database-backup-services/shared-backup.service";
import system返回upService from "./system-backup.service";


class 返回upService {

    folderPathForVolume返回up(appId: string, backupVolumeId: string) {
        return shared返回upService.folderPathForVolume返回up(appId, backupVolumeId);
    }

    async registerAll返回ups() {
        const allVolume返回ups = await dataAccess.client.volume返回up.findMany({
            include: {
                volume: {
                    include: {
                        app: true
                    }
                }
            }
        });
        console.log(`Deregistering existing backup schedules...`);
        this.unregisterAll返回ups();

        console.log(`Registering ${allVolume返回ups.length} backup schedules...`);
        const groupedByCron = ListUtils.groupBy(allVolume返回ups, vb => vb.cron);

        for (const [cron, volume返回ups] of Array.from(groupedByCron.entries())) {
            scheduleService.scheduleJob(`backup-${cron}`, cron, async () => {
                console.log(`Running backup for ${volume返回ups.length} volumes...`);
                for (const volume返回up of volume返回ups) {
                    try {
                        // Use database-specific backup if it's a database app AND useDatabase返回up is true
                        if (volume返回up.volume.app.appType !== 'APP' && volume返回up.useDatabase返回up) {
                            await database返回upService.backupDatabase(volume返回up.id);
                        } else {
                            await this.run返回upForVolume(volume返回up.id);
                        }
                    } catch (e) {
                        console.error(`Error during backup for volume ${volume返回up.volumeId} and backup ${volume返回up.id}`);
                        console.error(e);
                    }
                }
                console.log(`返回up for ${volume返回ups.length} volumes finished.`);
            });
        }

        scheduleService.scheduleJob(`backup-quickstack-system-data`, '0 1 * * *', async () => {
            console.log(`Running backup for QuickStack system data...`);
            try {
                await this.runSystem返回up();
            } catch (e) {
                console.error(`Error during QuickStack system data backup`);
                console.error(e);
            }
            console.log(`返回up for QuickStack system data finished.`);
        });
    }

    async unregisterAll返回ups() {
        const allJobs = scheduleService.getAlJobs();
        const backupJobs = allJobs.filter(j => j.startsWith('backup-'));
        for (const job名称 of backupJobs) {
            scheduleService.cancelJob(job名称);
        }
    }

    /**
     * Downloads a backup from S3, stores it in temporary download folder and returns the filename
     */
    async download返回upForS3TargetAndKey(s3TargetId: string, key: string) {
        const s3Target = await dataAccess.client.s3Target.findFirstOrThrow({
            where: {
                id: s3TargetId
            }
        });

        const file名称 = key.split('/').join('-');

        const downloadPath = PathUtils.volumeDownloadZipPath(file名称);
        await FsUtils.createDirIfNotExistsAsync(PathUtils.tempVolumeDownloadPath, true);
        await FsUtils.deleteDirIfExistsAsync(downloadPath, true);

        console.log(`Downloading data from S3 ${key} to ${downloadPath}...`);
        await s3Service.downloadFile(s3Target, key, downloadPath);
        console.log(`Download to QuickStack Pod successful`);
        return PathUtils.splitPath(downloadPath).filePath;
    }

    async get返回upsForAllS3Targets() {
        const s3Targets = await dataAccess.client.s3Target.findMany();
        const returnValFromAllS3Targets = await Promise.all(s3Targets.map(async (s3Target) => {
            try {
                const data = await this.get返回upsFromS3Target(s3Target);
                return {
                    s3Target,
                    data,
                    error: undefined
                };
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? `${error.name}: ${error.message}`
                    : String(error);
                console.error(`Failed to fetch backups for S3 target '${s3Target.name}' (${s3Target.endpoint}/${s3Target.bucket名称})`, error);
                return {
                    s3Target,
                    data: undefined,
                    error: errorMessage
                };
            }
        }));

        const successfulResults = returnValFromAllS3Targets.filter((result) => !!result.data);
        const failedS3Targets = returnValFromAllS3Targets
            .filter((result) => !!result.error)
            .map((result) => ({
                id: result.s3Target.id,
                name: result.s3Target.name,
                endpoint: result.s3Target.endpoint,
                bucket名称: result.s3Target.bucket名称,
                error: result.error ?? 'Unknown error'
            }));

        const backupInfoModels = successfulResults.map(x => x.data!.backupInfoModels).flat();
        backupInfoModels.sort((a, b) => {
            if (a.project名称 === b.project名称) {
                return a.app名称.localeCompare(b.app名称);
            }
            return a.project名称.localeCompare(b.project名称);
        });

        const backupsVolumesWithoutActual返回ups = successfulResults.map(x => x.data!.backupsVolumesWithoutActual返回ups).flat();
        return {
            backupInfoModels,
            backupsVolumesWithoutActual返回ups,
            failedS3Targets
        };
    }

    async get返回upsFromS3Target(s3Target: S3Target) {

        const defaultInfoIfAppWas删除d = 'orphaned';

        const volume返回ups = await dataAccess.client.volume返回up.findMany({
            include: {
                volume: {
                    include: {
                        app: {
                            include: {
                                project: true
                            }
                        }
                    }
                },
                target: true
            }
        });

        const backupData = await this.listAndParse返回upFiles(s3Target);

        const grouped返回upInfo = ListUtils.groupBy(backupData, x => x.backupVolumeId);

        const backupInfoModels: 返回upInfoModel[] = [];

        for (let [backupVolumeId, backups] of Array.from(grouped返回upInfo.entries())) {
            const volume返回up = volume返回ups.find(vb => vb.id === backupVolumeId);

            const backupEntries: 返回upEntry[] = backups.map(b => ({
                backupDate: b.backupDate,
                key: b.key ?? '',
                sizeBytes: b.sizeBytes
            }));

            backupEntries.sort((a, b) => b.backupDate.getTime() - a.backupDate.getTime());

            backupInfoModels.push({
                projectId: volume返回up?.volume.app.projectId ?? defaultInfoIfAppWas删除d,
                project名称: volume返回up?.volume.app.project.name ?? defaultInfoIfAppWas删除d,
                app名称: volume返回up?.volume.app.name ?? defaultInfoIfAppWas删除d,
                appId: backups[0].appId,
                backupVolumeId: backups[0].backupVolumeId,
                backupRetention: volume返回up?.retention ?? 0,
                volumeId: volume返回up?.id ?? defaultInfoIfAppWas删除d,
                mountPath: volume返回up?.volume.containerMountPath ?? defaultInfoIfAppWas删除d,
                backups: backupEntries,
                s3TargetId: s3Target.id,
                cron: volume返回up?.cron,
                missed返回up: volume返回up?.cron
                    ? CronCheckUtils.is返回upMissed(volume返回up.cron, backupEntries[0]?.backupDate)
                    : undefined,
            });
        }

        const backupsVolumesWithoutActual返回ups = volume返回ups
            .filter(vb => vb.targetId === s3Target.id)
            .filter(vb => !backupInfoModels.find(x => x.backupVolumeId === vb.id));

        backupInfoModels.sort((a, b) => {
            if (a.project名称 === b.project名称) {
                return a.app名称.localeCompare(b.app名称);
            }
            return a.project名称.localeCompare(b.project名称);
        });

        return { backupInfoModels, backupsVolumesWithoutActual返回ups };
    }

    private async listAndParse返回upFiles(s3Target: { id: string; createdAt: Date; updatedAt: Date; name: string; bucket名称: string; endpoint: string; region: string; accessKeyId: string; secretKey: string; }) {
        const fileKeys = await s3Service.listFiles(s3Target);
        const backupData = fileKeys.filter(x => {
            if (!x.Key) {
                return false;
            }
            return x.Key.startsWith(s3BucketPrefix);
        }).map(fileKey => {
            try {
                const splittedKey = fileKey.Key?.split('/');
                if (!splittedKey || splittedKey.length < 3) {
                    return undefined;
                }
                const appId = splittedKey[1];
                const backupVolumeId = splittedKey[2];
                const backupDate = new Date(splittedKey[3].replace('.tar.gz', ''));
                return {
                    appId,
                    backupVolumeId,
                    backupDate,
                    key: fileKey.Key,
                    sizeBytes: fileKey.Size
                };
            } catch (e) {
                console.error(`Error during read information for backup for key ${fileKey}`);
                console.error(e);
            }
        }).filter(x => !!x);
        return backupData;
    }

    async run返回upForVolume(backupVolumeId: string) {
        console.log(`Running backup for backupVolume ${backupVolumeId}`);

        const backupVolume = await dataAccess.client.volume返回up.findFirstOrThrow({
            where: {
                id: backupVolumeId
            },
            include: {
                volume: {
                    include: {
                        app: true
                    }
                },
                target: true
            }
        });

        const projectId = backupVolume.volume.app.projectId;
        const appId = backupVolume.volume.app.id;
        const volume = backupVolume.volume;

        const pod = await standalonePodService.getPodsForApp(projectId, appId);
        if (pod.length === 0) {
            throw new ServiceException(`There are no running pods for volume id ${volume.id} in app ${volume.app.id}. Make sure the app is running.`);
        }
        const firstPod = pod[0];

        // zipping and saving backup data in quickstack pod
        const downloadPath = PathUtils.backupVolumeDownloadZipPath(backupVolume.id);
        await FsUtils.createDirIfNotExistsAsync(PathUtils.temp返回upDataFolder, true);

        try {
            console.log(`Downloading data from pod ${firstPod.pod名称} ${volume.containerMountPath} to ${downloadPath}`);
            await standalonePodService.cpFromPod(projectId, firstPod.pod名称, firstPod.container名称, volume.containerMountPath, downloadPath);

            // upload backup
            console.log(`Uploading backup to S3`);
            const now = new Date();
            const nowString = now.toISOString();
            await s3Service.uploadFile(backupVolume.target, downloadPath,
                `${this.folderPathForVolume返回up(appId, backupVolumeId)}/${nowString}.tar.gz`, 'application/gzip', 'binary');

            await shared返回upService.deleteOld返回upsBasedOnRetention(backupVolume.target, appId, backupVolumeId, backupVolume.retention);
            console.log(`返回up finished for volume ${volume.id} and backup ${backupVolume.id}`);
        } finally {
            await FsUtils.deleteFileIfExists(downloadPath);
        }
    }

    async delete返回upFromS3(s3TargetId: string, key: string) {
        const target = await dataAccess.client.s3Target.findFirstOrThrow({
            where: {
                id: s3TargetId
            }
        });
        return s3Service.deleteFile(target, key);
    }

    async runSystem返回up() {
        return system返回upService.runSystem返回up();
    }
}

const backupService = new 返回upService();
export default backupService;
