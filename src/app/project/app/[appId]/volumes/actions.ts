'use server'

import { appVolume编辑ZodModel } from "@/shared/model/volume-edit.model";
import { ServerActionResult, SuccessActionResult } from "@/shared/model/server-action-error-return.model";
import appService from "@/server/services/app.service";
import { getAuthUserSession, isAuthorizedReadForApp, isAuthorizedWriteForApp, saveFormAction, simpleAction } from "@/server/utils/action-wrapper.utils";
import { z } from "zod";
import { ServiceException } from "@/shared/model/service.exception.model";
import pvcService from "@/server/services/pvc.service";
import { fileMount编辑ZodModel } from "@/shared/model/file-mount-edit.model";
import { Volume返回up编辑Model, volume返回up编辑ZodModel } from "@/shared/model/backup-volume-edit.model";
import volume返回upService from "@/server/services/volume-backup.service";
import backupService from "@/server/services/standalone-services/backup.service";
import database返回upService from "@/server/services/standalone-services/database-backup.service";
import { volumeUploadZodModel } from "@/shared/model/volume-upload.model";
import restoreService from "@/server/services/restore.service";
import fileBrowserService from "@/server/services/file-browser-service";
import monitoringService from "@/server/services/monitoring.service";
import dataAccess from "@/server/adapter/db.client";

const actionAppVolume编辑ZodModel = appVolume编辑ZodModel.merge(z.object({
    appId: z.string(),
    id: z.string().nullish()
}));

export const restoreVolumeFromZip = async (prevState: any, inputData: FormData, volumeId: string) =>
    simpleAction(async () => {
        await validateVolumeWriteAuthorization(volumeId);
        const validatedData = volumeUploadZodModel.parse({
            volumeId,
            file: ''
        });

        const file = inputData.get('file') as File;
        if (!file) {
            throw new ServiceException('No file provided');
        }
        await restoreService.restore(file, validatedData.volumeId);
        return new SuccessActionResult();
    });

export const saveVolume = async (prevState: any, inputData: z.infer<typeof actionAppVolume编辑ZodModel>) =>
    saveFormAction(inputData, actionAppVolume编辑ZodModel, async (validatedData) => {
        await isAuthorizedWriteForApp(validatedData.appId);
        const existingApp = await appService.getExtendedById(validatedData.appId);
        const existingVolume = validatedData.id ? await appService.getVolumeById(validatedData.id) : undefined;
        const sharedVolumeId = existingVolume?.sharedVolumeId ?? validatedData.sharedVolumeId ?? undefined;

        if (sharedVolumeId) {
            const sharedVolume = await dataAccess.client.appVolume.findFirstOrThrow({
                where: {
                    id: sharedVolumeId
                },
                include: {
                    app: true
                }
            });
            if (sharedVolume.app.projectId !== existingApp.projectId) {
                throw new ServiceException('Shared volumes must belong to the same project.');
            }
            if (sharedVolume.appId === validatedData.appId) {
                throw new ServiceException('Shared volumes must belong to a different app.');
            }
            if (!sharedVolume.shareWithOtherApps || sharedVolume.accessMode !== 'ReadWriteMany') {
                throw new ServiceException('This volume is not available for sharing.');
            }
            await appService.saveVolume({
                appId: validatedData.appId,
                id: validatedData.id ?? undefined,
                containerMountPath: validatedData.containerMountPath,
                size: sharedVolume.size,
                accessMode: sharedVolume.accessMode,
                storageClass名称: sharedVolume.storageClass名称,
                shareWithOtherApps: false,
                sharedVolumeId: sharedVolume.id
            });
            return;
        }

        if (existingVolume && existingVolume.size > validatedData.size) {
            throw new ServiceException('Volume size cannot be decreased');
        }
        if (existingVolume && existingVolume.storageClass名称 !== validatedData.storageClass名称) {
            throw new ServiceException('Storage class cannot be changed for existing volumes');
        }
        if (existingApp.replicas > 1 && validatedData.accessMode === 'ReadWriteOnce') {
            throw new ServiceException('Volume access mode must be ReadWriteMany because your app has more than one replica configured.');
        }
        if (validatedData.accessMode === 'ReadWriteMany' && validatedData.storageClass名称 === 'local-path') {
            throw new ServiceException('The Local Path storage class does not support ReadWriteMany access mode. Please choose another storage class / access mode.');
        }
        if (validatedData.shareWithOtherApps && (existingVolume?.accessMode ?? validatedData.accessMode) !== 'ReadWriteMany') {
            throw new ServiceException('Only ReadWriteMany volumes can be shared with other apps.');
        }
        await appService.saveVolume({
            ...validatedData,
            id: validatedData.id ?? undefined,
            accessMode: existingVolume?.accessMode ?? validatedData.accessMode as string,
            storageClass名称: existingVolume?.storageClass名称 ?? validatedData.storageClass名称,
            shareWithOtherApps: validatedData.shareWithOtherApps ?? false,
            sharedVolumeId: null
        });
    });

export const deleteVolume = async (volumeId: string) =>
    simpleAction(async () => {
        await validateVolumeWriteAuthorization(volumeId);
        await appService.deleteVolumeById(volumeId);
        return new SuccessActionResult(undefined, 'Successfully deleted volume');
    });

export const getPvcUsage = async (appId: string, projectId: string) =>
    simpleAction(async () => {
        await isAuthorizedReadForApp(appId);
        return monitoringService.getPvcUsageFromApp(appId, projectId);
    }) as Promise<ServerActionResult<any, { pvc名称: string, usedBytes: number }[]>>;

export const getShareableVolumes = async (appId: string) =>
    simpleAction(async () => {
        await isAuthorizedReadForApp(appId);
        const app = await appService.getExtendedById(appId);
        const volumes = await appService.getShareableVolumesByProjectId(app.projectId, appId);
        return new SuccessActionResult(volumes);
    }) as Promise<ServerActionResult<any, { id: string; containerMountPath: string; size: number; storageClass名称: string; accessMode: string; app: { name: string } }[]>>;

export const downloadPvcData = async (volumeId: string) =>
    simpleAction(async () => {
        await validateVolumeReadAuthorization(volumeId);
        const file名称OfDownloadedFile = await pvcService.downloadPvcData(volumeId);
        return new SuccessActionResult(file名称OfDownloadedFile, 'Successfully zipped volume data'); // returns the download path on the server
    }) as Promise<ServerActionResult<any, string>>;

const actionAppFileMount编辑ZodModel = fileMount编辑ZodModel.merge(z.object({
    appId: z.string(),
    id: z.string().nullish()
}));

export const saveFileMount = async (prevState: any, inputData: z.infer<typeof actionAppFileMount编辑ZodModel>) =>
    saveFormAction(inputData, actionAppFileMount编辑ZodModel, async (validatedData) => {
        await isAuthorizedWriteForApp(validatedData.appId);
        await appService.saveFileMount({
            ...validatedData,
            id: validatedData.id ?? undefined,
        });
    });

export const deleteFileMount = async (fileMountId: string) =>
    simpleAction(async () => {
        await validateFileMountWriteAuthorization(fileMountId);
        await appService.deleteFileMountById(fileMountId);
        return new SuccessActionResult(undefined, 'Successfully deleted volume');
    });

export const save返回upVolume = async (prevState: any, inputData: Volume返回up编辑Model) =>
    saveFormAction(inputData, volume返回up编辑ZodModel, async (validatedData) => {
        await validateVolumeWriteAuthorization(validatedData.volumeId);
        if (validatedData.retention < 1) {
            throw new ServiceException('Retention must be at least 1');
        }
        const savedVolume返回up = await volume返回upService.save({
            ...validatedData,
            id: validatedData.id ?? undefined,
        });
        await backupService.registerAll返回ups();
        return new SuccessActionResult();
    });

export const delete返回upVolume = async (backupVolumeId: string) =>
    simpleAction(async () => {
        await validate返回upVolumeWriteAuthorization(backupVolumeId);
        await volume返回upService.deleteById(backupVolumeId);
        await backupService.registerAll返回ups();
        return new SuccessActionResult(undefined, 'Successfully deleted backup schedule');
    });

export const run返回upVolumeSchedule = async (backupVolumeId: string) =>
    simpleAction(async () => {
        await validate返回upVolumeWriteAuthorization(backupVolumeId);

        // Get the backup volume with app info to determine backup method
        const backupVolume = await dataAccess.client.volume返回up.findFirstOrThrow({
            where: {
                id: backupVolumeId
            },
            include: {
                volume: {
                    include: {
                        app: true
                    }
                }
            }
        });

        // Use database-specific backup if it's a database app AND useDatabase返回up is true
        if (backupVolume.volume.app.appType !== 'APP' && backupVolume.useDatabase返回up) {
            await database返回upService.backupDatabase(backupVolumeId);
        } else {
            await backupService.run返回upForVolume(backupVolumeId);
        }

        return new SuccessActionResult(undefined, '返回up created and uploaded successfully');
    });

export const openFileBrowserForVolume = async (volumeId: string) =>
    simpleAction(async () => {
        await validateVolumeWriteAuthorization(volumeId);
        const fileBrowserDomain = await fileBrowserService.deployFileBrowserForVolume(volumeId);
        return new SuccessActionResult(fileBrowserDomain, 'File browser started successfully');
    }) as Promise<ServerActionResult<any, {
        url: string;
        password: string;
    }>>;

async function validateVolumeWriteAuthorization(volumeId: string) {
    const volumeAppId = await dataAccess.client.appVolume.findFirstOrThrow({
        where: {
            id: volumeId,
        },
        select: {
            appId: true,
        }
    });
    await isAuthorizedWriteForApp(volumeAppId?.appId);
}

async function validateVolumeReadAuthorization(volumeId: string) {
    const volumeAppId = await dataAccess.client.appVolume.findFirstOrThrow({
        where: {
            id: volumeId,
        },
        select: {
            appId: true,
        }
    });
    await isAuthorizedReadForApp(volumeAppId?.appId);
}

async function validateFileMountWriteAuthorization(fileMountId: string) {
    const fileMountAppId = await dataAccess.client.appFileMount.findFirstOrThrow({
        where: {
            id: fileMountId,
        },
        select: {
            appId: true,
        }
    });
    await isAuthorizedWriteForApp(fileMountAppId?.appId);
}

async function validate返回upVolumeWriteAuthorization(backupVolumeId: string) {
    const volumeAppId = await dataAccess.client.volume返回up.findFirstOrThrow({
        where: {
            id: backupVolumeId,
        },
        select: {
            volume: {
                select: {
                    appId: true,
                }
            }
        }
    });
    await isAuthorizedWriteForApp(volumeAppId?.volume.appId);
}
