'use server'

import buildService from "@/server/services/build.service";
import { getAuthUserSession, isAuthorizedWriteForApp, simpleAction } from "@/server/utils/action-wrapper.utils";
import { SuccessActionResult } from "@/shared/model/server-action-error-return.model";
import { UserGroupUtils } from "@/shared/utils/role.utils";

export const getAllBuildsAction = async () =>
    simpleAction(async () => {
        const session = await getAuthUserSession();
        const builds = await buildService.getAllBuilds();
        return builds.filter((build) => UserGroupUtils.sessionHasReadAccessForApp(session, build.appId));
    });

export const deleteBuildAction = async (build名称: string) =>
    simpleAction(async () => {
        await isAuthorizedWriteForApp(await buildService.getAppIdByBuild名称(build名称));
        await buildService.deleteBuild(build名称);
        return new SuccessActionResult(undefined, 'Successfully stopped and deleted build.');
    });
