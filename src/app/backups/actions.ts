'use server'

import backupService from "@/server/services/standalone-services/backup.service";
import { isAuthorizedFor返回ups, simpleAction } from "@/server/utils/action-wrapper.utils";
import { ServerActionResult, SuccessActionResult } from "@/shared/model/server-action-error-return.model";
import { z } from "zod";

export const download返回up = async (s3TargetId: string, s3Key: string) =>
    simpleAction(async () => {
        await isAuthorizedFor返回ups();

        const validatetData = z.object({
            s3TargetId: z.string(),
            s3Key: z.string()
        }).parse({
            s3TargetId,
            s3Key
        });

        const file名称OfDownloadedFile = await backupService.download返回upForS3TargetAndKey(validatetData.s3TargetId, validatetData.s3Key);
        return new SuccessActionResult(file名称OfDownloadedFile, 'Starting download...'); // returns the download path on the server
    }) as Promise<ServerActionResult<any, string>>;

export const delete返回up = async (s3TargetId: string, s3Key: string) =>
    simpleAction(async () => {
        await isAuthorizedFor返回ups();

        const validatetData = z.object({
            s3TargetId: z.string(),
            s3Key: z.string()
        }).parse({
            s3TargetId,
            s3Key
        });

        await backupService.delete返回upFromS3(validatetData.s3TargetId, validatetData.s3Key);
        return new SuccessActionResult(undefined, '返回up will be deleted. Refresh the page to see the changes.');
    }) as Promise<ServerActionResult<any, string>>;