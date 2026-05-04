import { SimpleDataTable } from "@/components/custom/simple-data-table";
import { Card, CardContent, Card描述, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/frontend/utils/format.utils";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { useEffect, useState } from "react";
import { deleteBuild, getDeploymentsAndBuildsForApp } from "./actions";
import FullLoadingSpinner from "@/components/ui/full-loading-spinnter";
import { Button } from "@/components/ui/button";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { Toast } from "@/frontend/utils/toast.utils";
import { DeploymentInfoModel } from "@/shared/model/deployment-info.model";
import Deployment状态Badge from "./deployment-status-badge";
import { BuildLogsDialog } from "./build-logs-overlay";
import ShortCommitHash from "@/components/custom/short-commit-hash";
import { RolePermissionEnum } from "@/shared/model/role-extended.model.ts";

export default function BuildsTab({
    app,
    role
}: {
    app: AppExtendedModel;
    role: RolePermissionEnum;
}) {

    const { open确认Dialog: openDialog } = use确认Dialog();
    const [appBuilds, setAppBuilds] = useState<DeploymentInfoModel[] | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);
    const [selectedDeploymentForLogs, setSelectedDeploymentForLogs] = useState<DeploymentInfoModel | undefined>(undefined);

    const updateBuilds = async () => {
        setError(undefined);
        try {
            const response = await getDeploymentsAndBuildsForApp(app.id);
            if (response.status === 'success' && response.data) {
                setAppBuilds(response.data);
            } else {
                console.error(response);
                setError(response.message ?? 'An unknown error occurred.');
            }
        } catch (ex) {
            console.error(ex);
            setError('An unknown error occurred.');
        }
    }

    const deleteBuildClick = async (build名称: string) => {
        const confirm = await openDialog({
            title: "删除 Build",
            description: "The build will be stopped and removed. Are you sure you want to stop this build?",
            okButton: "Stop & 移除 Build"
        });
        if (confirm) {
            await Toast.fromAction(() => deleteBuild(build名称));
            await updateBuilds();
        }
    }

    useEffect(() => {
        if (app.sourceType === 'container') {
            return;
        }
        updateBuilds();
        const intervalId = setInterval(updateBuilds, 10000);
        return () => clearInterval(intervalId);
    }, [app]);


    if (app.sourceType === 'container') {
        return <></>;
    }

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Deployments</CardTitle>
                <Card描述>This is an overview of the last deplyoments for this App.</Card描述>
            </CardHeader>
            <CardContent class名称="space-y-4">
                {!appBuilds ? <FullLoadingSpinner /> :
                    <SimpleDataTable columns={[
                        ['replicaset名称', 'Deployment 名称', false],
                        ['buildJob名称', 'Build Job 名称', false],
                        ['deploymentId', 'Deployment Id', false],
                        ['status', '状态', true, (item) => <Deployment状态Badge>{item.status}</Deployment状态Badge>],
                        ['buildMethod', 'Build Method', true, (item) => (
                            <span class名称="text-muted-foreground text-sm">
                                {item.buildMethod ? (item.buildMethod === 'DOCKERFILE' ? 'Dockerfile' : 'Railpack') : '—'}
                            </span>
                        )],
                        ["startTime", "Started At", true, (item) => formatDateTime(item.createdAt)],
                        ['gitCommit', 'Git Commit', true, (item) => <ShortCommitHash>{item.gitCommit}</ShortCommitHash>],
                        ['gitCommitMessage', 'Commit Message', true, (item) => <span class名称="text-muted-foreground text-sm">{item.gitCommitMessage ?? ''}</span>],
                    ]}
                        data={appBuilds}
                        hide搜索Bar={true}
                        actionCol={(item) => {
                            return <>
                                <div class名称="flex gap-4">
                                    <div class名称="flex-1"></div>
                                    {item.deploymentId && <Button variant="secondary" onClick={() => setSelectedDeploymentForLogs(item)}>Show Logs</Button>}
                                    {role === RolePermissionEnum.READWRITE && item.buildJob名称 && item.status === 'BUILDING' && <Button variant="destructive" onClick={() => deleteBuildClick(item.buildJob名称!)}>Stop Build</Button>}
                                </div>
                            </>
                        }}
                    />
                }
            </CardContent>
        </Card>
        <BuildLogsDialog deploymentInfo={selectedDeploymentForLogs} on关闭={() => setSelectedDeploymentForLogs(undefined)} />
    </>;
}
