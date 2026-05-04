'use server'

import { SuccessActionResult } from "@/shared/model/server-action-error-return.model";
import appService from "@/server/services/app.service";
import { getAuthUserSession, isAuthorizedWriteForApp, saveFormAction, simpleAction } from "@/server/utils/action-wrapper.utils";
import { z } from "zod";
import appTemplateService from "@/server/services/app-template.service";
import { AppTemplateModel, appTemplateZodModel } from "@/shared/model/app-template.model";
import { ServiceException } from "@/shared/model/service.exception.model";
import dbGateService from "@/server/services/db-tool-services/dbgate.service";
import fileBrowserService from "@/server/services/file-browser-service";
import phpMyAdminService from "@/server/services/db-tool-services/phpmyadmin.service";
import pgAdminService from "@/server/services/db-tool-services/pgadmin.service";
import { UserGroupUtils } from "@/shared/utils/role.utils";

const createAppSchema = z.object({
    app名称: z.string().min(1)
});

export const createApp = async (app名称: string, projectId: string, appId?: string) =>
    saveFormAction({ app名称 }, createAppSchema, async (validatedData) => {
        const session = await getAuthUserSession();
        if (!UserGroupUtils.sessionCan创建NewAppsForProject(session, projectId)) {
            throw new ServiceException("You are not allowed to create new apps.");
        }

        const returnData = await appService.save({
            id: appId ?? undefined,
            name: validatedData.app名称,
            projectId
        });

        return new SuccessActionResult(returnData, "App created successfully.");
    });

export const createAppFromTemplate = async (prevState: any, inputData: AppTemplateModel, projectId: string) =>
    saveFormAction(inputData, appTemplateZodModel, async (validatedData) => {
        const session = await getAuthUserSession();
        if (!UserGroupUtils.sessionCan创建NewAppsForProject(session, projectId)) {
            throw new ServiceException("You are not allowed to create new apps.");
        }
        if (validatedData.templates.some(x => x.input设置.some(y => !y.randomGeneratedIfEmpty && !y.value))) {
            throw new ServiceException('Please fill out all required fields.');
        }
        await appTemplateService.createAppFromTemplate(projectId, validatedData);
        return new SuccessActionResult(undefined, "");
    });

export const deleteApp = async (appId: string) =>
    simpleAction(async () => {
        const session = await getAuthUserSession();
        const app = await appService.getExtendedById(appId);
        if (!UserGroupUtils.sessionCan删除AppsForProject(session, app.projectId)) {
            throw new ServiceException("You are not allowed to delete apps in this project.");
        }
        // First delete external services wich might be running
        await dbGateService.deleteToolForAppIfExists(appId);
        await phpMyAdminService.deleteToolForAppIfExists(appId);
        await pgAdminService.deleteToolForAppIfExists(appId);
        for (const volume of app.appVolumes) {
            await fileBrowserService.deleteFileBrowserForVolumeIfExists(volume.id);
        }
        // delete the app drom database and all kubernetes objects
        await appService.deleteById(appId);
        return new SuccessActionResult(undefined, "App deleted successfully.");
    });