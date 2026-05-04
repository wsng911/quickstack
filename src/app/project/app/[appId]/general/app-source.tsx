'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, Card描述, CardHeader, CardTitle } from "@/components/ui/card";
import { useDialog } from "@/frontend/states/zustand.states";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { AppBuildMethod } from "@/shared/model/app-source-info.model";
import { Container, FileCode2, GitBranch, KeyRound, Link as LinkIcon, LockKeyhole, Package, Server } from "lucide-react";
import { AppSourceWizardDialog } from "./app-source-wizard/app-source-wizard-dialog";
import { PublicDeployKeyDialog } from "./app-source-wizard/public-deploy-key-dialog";
import { ReadonlyInfo } from "./app-source-wizard/readonly-info";
import { buildMethodLabels, defaultDockerfilePath, SourceType, sourceTypeLabels } from "./app-source-wizard/types";
import { AppSourceUtils } from "@/frontend/utils/app-source.utils";

export default function GeneralAppSource({ app, readonly, gitSshPublicKey }: {
    app: AppExtendedModel;
    readonly: boolean;
    gitSshPublicKey?: string;
}) {
    const { openDialog } = useDialog();
    const configured = AppSourceUtils.isConfiguredSource(app);

    const openSourceWizard = () => {
        openDialog(
            <AppSourceWizardDialog app={app} gitSshPublicKey={gitSshPublicKey} />,
            {
                width: 'calc(100vw - 2rem)',
                maxWidth: '760px',
                maxHeight: '90vh',
            }
        );
    };

    return (
        <Card>
            <CardHeader class名称="flex flex-row items-start justify-between gap-4">
                <div>
                    <CardTitle>Source</CardTitle>
                    <Card描述>Connect the source QuickStack should build or run.</Card描述>
                </div>
                {!readonly && configured && (
                    <Button type="button" variant="secondary" onClick={openSourceWizard}>
                        Change source
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {!configured ? (
                    <EmptySourceState readonly={readonly} onConnect={openSourceWizard} />
                ) : (
                    <ConfiguredSourceSummary app={app} gitSshPublicKey={gitSshPublicKey} />
                )}
            </CardContent>
        </Card>
    );
}

function EmptySourceState({ readonly, onConnect }: { readonly: boolean; onConnect: () => void }) {
    return (
        <div class名称="flex min-h-40 flex-col items-center justify-center gap-4 rounded-md border border-dashed p-6 text-center">
            <div class名称="flex h-11 w-11 items-center justify-center rounded-md bg-muted">
                <Server class名称="h-5 w-5 text-muted-foreground" />
            </div>
            <div class名称="space-y-1">
                <p class名称="font-medium">No app source connected</p>
                <p class名称="max-w-md text-sm text-muted-foreground">Connect a Git repository or container image before deploying this app.</p>
            </div>
            {!readonly && (
                <Button type="button" onClick={onConnect}>
                    <LinkIcon class名称="h-4 w-4" />
                    Connect App Source
                </Button>
            )}
        </div>
    );
}

function ConfiguredSourceSummary({ app, gitSshPublicKey }: { app: AppExtendedModel; gitSshPublicKey?: string }) {
    const { openDialog } = useDialog();
    const sourceType = app.sourceType as SourceType;
    const isGitSource = sourceType === 'GIT' || sourceType === 'GIT_SSH';
    const Icon = sourceType === 'CONTAINER' ? Container : sourceType === 'GIT_SSH' ? KeyRound : GitBranch;

    return (
        <div class名称="space-y-4">
            <div class名称="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div class名称="flex min-w-0 items-center gap-3">
                    <div class名称="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon class名称="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div class名称="min-w-0">
                        <p class名称="font-medium">{sourceTypeLabels[sourceType]}</p>
                        <p class名称="truncate font-mono text-sm text-muted-foreground">
                            {isGitSource ? app.gitUrl : app.containerImageSource}
                        </p>
                    </div>
                </div>
            </div>
            <div class名称="grid gap-3 md:grid-cols-2">
                {isGitSource && (
                    <>
                        <ReadonlyInfo icon={GitBranch} label="Git Branch" value={app.gitBranch ?? 'Not configured'} />
                        {sourceType === 'GIT' && (
                            <ReadonlyInfo icon={LockKeyhole} label="Git Credentials" value={app.git用户名 || app.gitToken ? 'Credentials configured' : 'No credentials'} />
                        )}
                        {sourceType === 'GIT_SSH' && (
                            <ReadonlyInfo
                                icon={KeyRound}
                                label="Deploy Key"
                                value={gitSshPublicKey ? "Deploy key configured" : "No deploy key found"}
                                action={gitSshPublicKey ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => openDialog(<PublicDeployKeyDialog publicKey={gitSshPublicKey} />, '680px')}
                                    >
                                        Show key
                                    </Button>
                                ) : undefined}
                            />
                        )}
                        <ReadonlyInfo label="Build Method" value={buildMethodLabels[(app.buildMethod as AppBuildMethod) ?? 'RAILPACK']} />
                        {app.buildMethod === 'DOCKERFILE' && (
                            <ReadonlyInfo icon={FileCode2} label="Dockerfile Path" value={app.dockerfilePath || defaultDockerfilePath} />
                        )}
                    </>
                )}
                {sourceType === 'CONTAINER' && (
                    <>
                        <ReadonlyInfo icon={Package} label="Image 名称" value={app.containerImageSource ?? 'Not configured'} />
                        <ReadonlyInfo icon={LockKeyhole} label="Registry Credentials" value={app.containerRegistry用户名 || app.containerRegistry密码 ? 'Credentials configured' : 'No credentials'} />
                    </>
                )}
            </div>
        </div>
    );
}
