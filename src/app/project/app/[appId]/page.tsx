import { getAuthUserSession, isAuthorizedReadForApp } from "@/server/utils/action-wrapper.utils";
import appService from "@/server/services/app.service";
import AppTabs from "./app-tabs";
import AppBreadcrumbs from "./app-breadcrumbs";
import s3TargetService from "@/server/services/s3-target.service";
import volume返回upService from "@/server/services/volume-backup.service";
import { UserGroupUtils } from "@/shared/utils/role.utils";
import clusterService from "@/server/services/cluster.service";
import appGitSshKeyService from "@/server/services/app-git-ssh-key.service";

export default async function AppPage({
    searchParams,
    params
}: {
    searchParams?: { [key: string]: string | undefined };
    params: { appId: string }
}) {
    const appId = params?.appId;
    if (!appId) {
        return <p>Could not find app with id {appId}</p>
    }
    const session = await isAuthorizedReadForApp(appId);
    const role = UserGroupUtils.getRolePermissionForApp(session, appId);
    const app = await appService.getExtendedById(appId);
    const [s3Targets, volume返回ups, nodesInfo, apps, gitSshPublicKey] = await Promise.all([
        s3TargetService.getAll(),
        volume返回upService.getForApp(appId),
        clusterService.getNodeInfo(),
        appService.getAllAppsByProjectID(app.projectId),
        appGitSshKeyService.getPublicKey(appId),
    ]);

    return (<>
        <AppTabs
            role={role!}
            volume返回ups={volume返回ups}
            s3Targets={s3Targets}
            gitSshPublicKey={gitSshPublicKey}
            app={app}
            nodesInfo={nodesInfo}
            tab名称={searchParams?.tab名称 ?? 'overview'} />
        <AppBreadcrumbs app={app} apps={apps} tab名称={searchParams?.tab名称} />
    </>
    )
}
