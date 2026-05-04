'use client';

import { Card, CardContent, Card描述, CardHeader, CardTitle } from "@/components/ui/card";
import { startLonghornUpgrade } from "./actions";
import { Button } from "@/components/ui/button";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { RefreshCw, ExternalLink, CheckCircle2, AlertCircle, HardDrive } from "lucide-react";
import React from "react";
import Link from "next/link";
import { Alert, Alert描述 } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { LonghornReleaseInfo } from "@/server/adapter/qs-versioninfo.adapter";

export default function LonghornUpdateInfo({
    longhornInstalled,
    longhornCurrentVersionInfo,
    longhornNextVersionInfo,
    longhornUpgradeIsInProgress,
}: {
    longhornInstalled: boolean;
    longhornCurrentVersionInfo?: LonghornReleaseInfo;
    longhornNextVersionInfo?: LonghornReleaseInfo;
    longhornUpgradeIsInProgress: boolean;
}) {

    const use确认 = use确认Dialog();
    const [loading, setLoading] = React.useState(false);
    const [upgradeInProgress, setUpgradeInProgress] = React.useState(longhornUpgradeIsInProgress);

    const handleUpgrade = async () => {
        if (await use确认.open确认Dialog({
            title: 'Start Longhorn Storage Upgrade',
            description: (
                <div class名称="space-y-3">
                    <p class名称="text-sm font-semibold text-orange-600">
                        ⚠️ Warning: This will upgrade Longhorn to version {longhornNextVersionInfo?.version}.
                    </p>
                    <p class名称="text-sm">
                        Before proceeding, ensure that:
                    </p>
                    <ul class名称="text-sm list-disc list-inside space-y-1 ml-2">
                        <li>All critical data has been backed up</li>
                        <li>Volume backups are configured and recent</li>
                        <li>No critical workloads are running that cannot tolerate brief interruptions</li>
                        <li>You have reviewed the release notes for breaking changes</li>
                    </ul>
                    <p class名称="text-sm">
                        The upgrade process will:
                    </p>
                    <ul class名称="text-sm list-disc list-inside space-y-1 ml-2">
                        <li>Upgrade the Longhorn manager components</li>
                        <li>Automatically upgrade volume engines (based on settings)</li>
                        <li>Attached volumes will be live-upgraded</li>
                        <li>Detached volumes will be offline-upgraded</li>
                    </ul>
                    <p class名称="text-sm font-medium">
                        Are you sure you want to proceed with the upgrade?
                    </p>
                </div>
            ),
            okButton: "Start Upgrade",
        })) {
            try {
                setLoading(true);
                await Toast.fromAction(() => startLonghornUpgrade());
                setUpgradeInProgress(true);
            } finally {
                setLoading(false);
            }
        }
    };

    if (!longhornInstalled) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle class名称="flex items-center gap-2">
                        <HardDrive class名称="h-5 w-5" />
                        Longhorn Storage Upgrades
                    </CardTitle>
                    <Card描述>
                        Longhorn is not installed in this cluster.
                    </Card描述>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertCircle class名称="h-4 w-4" />
                        <Alert描述>
                            Longhorn storage system is not detected. It may not be installed or is not accessible.
                        </Alert描述>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle class名称="flex items-center gap-2">
                    <HardDrive class名称="h-5 w-5" />
                    Longhorn Storage Upgrades
                </CardTitle>
                <Card描述>
                    Longhorn provides distributed block storage for your Kubernetes cluster.
                    Keep it up-to-date for improved performance, stability, and new features.
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <QuestionMarkCircledIcon />
                            </TooltipTrigger>
                            <TooltipContent>
                                <div class名称="space-y-3 max-w-xl">
                                    <h4 class名称="text-sm font-medium">About Longhorn Upgrades</h4>
                                    <p class名称="text-sm text-muted-foreground">
                                        Longhorn upgrades are performed by applying the new Longhorn manifest to your cluster.
                                        The upgrade process will update all Longhorn components including the manager, engine, and UI.
                                    </p>
                                    <p class名称="text-sm text-muted-foreground">
                                        <strong>Volume Engine Upgrades:</strong> After upgrading Longhorn manager, volume engines
                                        are automatically upgraded.
                                        Attached volumes are live-upgraded while detached volumes are offline-upgraded.
                                    </p>
                                    <div class名称="flex items-center gap-2 text-sm">
                                        <Link
                                            href="https://longhorn.io/docs/latest/deploy/upgrade/"
                                            target="_blank"
                                            class名称="flex items-center gap-1 text-primary hover:underline"
                                        >
                                            <ExternalLink class名称="h-4 w-4" />
                                            View Longhorn Upgrade Documentation
                                        </Link>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </Card描述>
            </CardHeader>
            <CardContent class名称="space-y-6">
                <div class名称="space-y-4">
                    <div class名称="rounded-lg border bg-muted/50 p-4">
                        <div class名称="space-y-3">
                            <div class名称="flex items-center justify-between">
                                <p class名称="text-sm font-medium">Current Longhorn Version</p>
                            </div>
                            {longhornCurrentVersionInfo ? (
                                <div class名称="space-y-1">
                                    <p class名称="text-2xl font-bold">{longhornCurrentVersionInfo.version}</p>
                                </div>
                            ) : (
                                <div class名称="space-y-1">
                                    <p class名称="text-sm text-muted-foreground">Version information not available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {upgradeInProgress ? (
                        <Alert class名称="text-orange-600 border-orange-400">
                            <RefreshCw class名称="h-4 w-4 animate-spin" />
                            <Alert描述>
                                A Longhorn upgrade is currently in progress.
                                The manager pods are being updated. Volume engines will be upgraded automatically afterwards.
                                Refresh this page to check the completion status.
                            </Alert描述>
                        </Alert>
                    ) : (
                        <>
                            {longhornNextVersionInfo && (
                                <div class名称="rounded-lg border border-primary/20 bg-primary/5 p-4">
                                    <div class名称="space-y-3">
                                        <div class名称="flex items-center gap-2">
                                            <CheckCircle2 class名称="h-5 w-5 text-green-500" />
                                            <p class名称="text-sm font-medium">Next Version Available</p>
                                        </div>
                                        <div class名称="space-y-1">
                                            <p class名称="text-2xl font-bold text-primary">{longhornNextVersionInfo.version}</p>
                                        </div>
                                        <Button
                                            disabled={loading}
                                            size="sm"
                                            class名称="w-full gap-2"
                                            onClick={handleUpgrade}
                                        >
                                            <RefreshCw class名称={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                            Upgrade to {longhornNextVersionInfo.version}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {longhornNextVersionInfo === undefined && (
                                <Alert>
                                    <Alert描述>
                                        Your cluster is running the latest available Longhorn version which is compatible with QuickStack.
                                    </Alert描述>
                                </Alert>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
