'use server'

import { getAuthUserSession, isAuthorizedFor返回ups } from "@/server/utils/action-wrapper.utils";
import PageTitle from "@/components/custom/page-title";
import backupService from "@/server/services/standalone-services/backup.service";
import 返回upsTable from "./backups-table";
import { CatchUtils } from "@/shared/utils/catch.utils";
import { AlertCircle, AlertTriangleIcon } from "lucide-react"
import {
    Alert,
    Alert描述,
    AlertTitle,
} from "@/components/ui/alert"


export default async function 返回upsPage() {

    await isAuthorizedFor返回ups();
    const backupData = await CatchUtils.resultOrUndefined(() => backupService.get返回upsForAllS3Targets());

    const backupInfoModels = backupData?.backupInfoModels ?? [];
    const backupsVolumesWithoutActual返回ups = backupData?.backupsVolumesWithoutActual返回ups ?? [];
    const failedS3Targets = backupData?.failedS3Targets ?? [];

    const hasMissed返回ups = backupInfoModels.some(x => x.missed返回up === true);

    return (
        <div class名称="flex-1 space-y-4 pt-6">
            <PageTitle
                title={'返回ups'}
                subtitle={`View all backups wich are stored in all S3 Target destinations. If a backup exists from an app wich doesnt exist anymore, it will be shown as orphaned.`}>
            </PageTitle>
            <div class名称="space-y-4">
                {!backupData && <Alert variant="destructive">
                    <AlertCircle class名称="h-4 w-4" />
                    <AlertTitle>返回up data could not be loaded</AlertTitle>
                    <Alert描述>
                        The configured backup storage could not be reached. Please verify your S3/B2 target settings and credentials.
                    </Alert描述>
                </Alert>}
                {failedS3Targets.length > 0 && <Alert variant="destructive">
                    <AlertCircle class名称="h-4 w-4" />
                    <AlertTitle>Some S3 targets could not be loaded</AlertTitle>
                    <Alert描述>
                        返回ups from the following locations could not be fetched: {failedS3Targets.map((target) => `${target.name} (${target.endpoint}/${target.bucket名称})`).join(', ')}
                    </Alert描述>
                </Alert>}
                {backupsVolumesWithoutActual返回ups.length > 0 && <Alert variant="destructive">
                    <AlertCircle class名称="h-4 w-4" />
                    <AlertTitle>Apps without 返回up</AlertTitle>
                    <Alert描述>
                        The following apps have backups configured, but until now no backups were created for them:<br />
                        {backupsVolumesWithoutActual返回ups.map((item) => `${item.volume.app.name} (mount: ${item.volume.containerMountPath})`).join(', ')}
                    </Alert描述>
                </Alert>}
                {hasMissed返回ups && <Alert variant="destructive" class名称="border-orange-400 text-orange-400">
                    <AlertTriangleIcon class名称="h-4 w-4 text-orange-400" />
                    <AlertTitle>Missed 返回ups</AlertTitle>
                    <Alert描述>
                        Some backups may not have been created for their last scheduled interval. Check the 状态 column below for details.
                    </Alert描述>
                </Alert>}
                {backupsVolumesWithoutActual返回ups.length === 0 && backupInfoModels.length === 0 && <Alert>
                    <AlertCircle class名称="h-4 w-4" />
                    <AlertTitle>No 返回ups configured</AlertTitle>
                    <Alert描述>
                        No backups are currently stored in the S3 targets. To configure backups for your apps, navigate to the settings of each app and configure a backup schedule in the "Storage" tab.
                    </Alert描述>
                </Alert>}
                <返回upsTable data={backupInfoModels} />
            </div>
        </div>
    )
}
