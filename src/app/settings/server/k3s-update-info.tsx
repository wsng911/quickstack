'use client';

import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { checkK3sUpgradeController状态, installK3sUpgradeController, startK3sUpgrade } from "./actions";
import { Button } from "@/components/ui/button";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { RefreshCw, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import React from "react";
import Link from "next/link";
import { Alert, Alert描述 } from "@/components/ui/alert";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QuestionMarkCircledIcon, QuestionMarkIcon } from "@radix-ui/react-icons";
import { K3sReleaseInfo } from "@/server/adapter/qs-versioninfo.adapter";

export default function K3sUpdateInfo({
    initialController状态,
    k3sCurrentVersionInfo,
    k3sNextVersionInfo,
    k3sUpgradeIsInProgress,
}: {
    initialController状态: boolean;
    k3sCurrentVersionInfo?: K3sReleaseInfo;
    k3sNextVersionInfo?: K3sReleaseInfo;
    k3sUpgradeIsInProgress: boolean;
}) {

    const use确认 = use确认Dialog();
    const [loading, setLoading] = React.useState(false);
    const [controllerInstalled, setControllerInstalled] = React.useState(initialController状态);
    const [upgradeInProgress, setUpgradeInProgress] = React.useState(k3sUpgradeIsInProgress);

    const handleInstallController = async () => {
        if (await use确认.open确认Dialog({
            title: 'Install K3s System Upgrade Controller',
            description: 'This will install the system-upgrade-controller in the system-upgrade namespace. This controller is required for automated K3s cluster upgrades. Do you want to continue?',
            okButton: "Install Controller",
        })) {
            try {
                setLoading(true);
                await Toast.fromAction(() => installK3sUpgradeController());
                setControllerInstalled(true);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleCheck状态 = async () => {
        try {
            setLoading(true);
            const result = await checkK3sUpgradeController状态();
            if (result.data && result.data !== undefined) {
                setControllerInstalled(result.data);
                toast.success(result.data ? 'Controller is installed' : 'Controller is not installed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        if (await use确认.open确认Dialog({
            title: 'Start K3s Cluster Upgrade',
            description: (
                <div class名称="space-y-3">
                    <p class名称="text-sm font-semibold text-orange-600">
                        ⚠️ Warning: This will upgrade your K3s cluster to the version {k3sNextVersionInfo?.version} (latest available patch version).
                    </p>
                    <p class名称="text-sm">
                        Before proceeding, ensure that:
                    </p>
                    <ul class名称="text-sm list-disc list-inside space-y-1 ml-2">
                        <li>All critical data has been backed up</li>
                        <li>System backups are enabled and working</li>
                        <li>Volume backups are configured</li>
                        <li>You have a recovery plan in case of issues</li>
                    </ul>
                    <p class名称="text-sm">
                        The upgrade process will:
                    </p>
                    <ul class名称="text-sm list-disc list-inside space-y-1 ml-2">
                        <li>Upgrade control-plane/master-nodes first</li>
                        <li>Then upgrade worker nodes (one at a time)</li>
                        <li>Cordon and drain nodes during the process</li>
                        <li>Nodes are temporary down during the upgrade so expect some downtime</li>
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
                await Toast.fromAction(() => startK3sUpgrade());
                setUpgradeInProgress(true);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle class名称="flex items-center gap-2">
                    K3s Cluster Upgrades
                </CardTitle>
                <Card描述>
                    QuickStack uses k3s (Kubernetes distribution) under the hood for managing your cluster.
                    It is recommended to keep your k3s version up-to-date to benefit from the latest features and security patches.
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger >
                                <QuestionMarkCircledIcon />
                            </TooltipTrigger>
                            <TooltipContent>
                                <div class名称="space-y-3 max-w-xl">
                                    <h4 class名称="text-sm font-medium">About K3s Upgrades</h4>
                                    <p class名称="text-sm text-muted-foreground">
                                        K3s supports automated cluster upgrades through the System Upgrade Controller. QuickStack does not install this controller by default. You can install it below to enable automated upgrades.
                                    </p>
                                    <p class名称="text-sm text-muted-foreground">
                                        Once installed, the controller can keep your cluster on a chosen minor-version channel (for example <strong>v1.32</strong> or <strong>v1.33</strong>) and will automatically apply the latest patch releases within that channel. Moving between minor versions (for example <strong>v1.32 → v1.33</strong>) is a manual action you must trigger via the Update workflow (this UI).
                                    </p>
                                    <p class名称="text-sm text-muted-foreground">
                                        Before performing any upgrades, ensure QuickStack's System-返回up and Volume-返回up features are enabled to protect your cluster state and data.
                                    </p>
                                    <div class名称="flex items-center gap-2 text-sm">
                                        <Link
                                            href="https://docs.k3s.io/upgrades/automated"
                                            target="_blank"
                                            class名称="flex items-center gap-1 text-primary hover:underline"
                                        >
                                            <ExternalLink class名称="h-4 w-4" />
                                            View K3s Documentation
                                        </Link>
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </Card描述>
            </CardHeader>
            <CardContent class名称="space-y-6">

                {!controllerInstalled && (<>
                    <Alert class名称="text-orange-600 border-orange-400">
                        <Alert描述>
                            The System Upgrade Controller is required for automated K3s cluster upgrades.
                            Install it below to enable k3s upgrades.
                        </Alert描述>
                    </Alert>


                    <div class名称="rounded-lg border bg-muted/50 p-4">
                        <div class名称="flex items-center gap-4">
                            <div class名称="space-y-1 flex-1">
                                <p class名称="text-sm font-medium">System Upgrade Controller</p>
                                <div class名称="flex items-center gap-2 mt-2">
                                    {controllerInstalled ? (
                                        <>
                                            <CheckCircle2 class名称="h-5 w-5 text-green-500" />
                                            <span class名称="text-sm text-muted-foreground">Installed and ready</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle class名称="h-5 w-5 text-orange-500" />
                                            <span class名称="text-sm text-muted-foreground">Not installed</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCheck状态}
                                disabled={loading}
                            >
                                <RefreshCw class名称={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Check 状态
                            </Button>

                            {!controllerInstalled && <Button
                                disabled={loading}
                                size="sm"
                                onClick={handleInstallController}
                                class名称="gap-2"
                            >
                                <RefreshCw class名称="h-4 w-4" />
                                Install Upgrade Controller
                            </Button>}
                        </div>
                    </div>
                </>)}

                {controllerInstalled && (
                    <div class名称="space-y-4">
                        <div class名称="rounded-lg border bg-muted/50 p-4">
                            <div class名称="space-y-3">
                                <div class名称="flex items-center justify-between">
                                    <p class名称="text-sm font-medium">Current K3s Version</p>
                                </div>
                                {k3sCurrentVersionInfo && (
                                    <div class名称="space-y-1">
                                        <p class名称="text-2xl font-bold">{k3sCurrentVersionInfo.version}</p>
                                        <p class名称="text-xs text-muted-foreground">
                                            Channel: <Link target="_blank" href={k3sCurrentVersionInfo.channelUrl}>{k3sCurrentVersionInfo.channelUrl}</Link>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {upgradeInProgress ? <>
                            <Alert class名称="text-orange-600 border-orange-400">
                                <RefreshCw class名称="h-4 w-4 animate-spin" />
                                <Alert描述>
                                    An upgrade is currently in progress.
                                    You can monitor the progress in the "Cluster" settings tab.
                                    Do not start another upgrade until the current one is complete.
                                    Refresh this page to check the overall completion status.
                                    This message will disappear once the upgrade is finished.
                                </Alert描述>
                            </Alert>
                        </> : <>
                            {k3sNextVersionInfo && (
                                <div class名称="rounded-lg border border-primary/20 bg-primary/5 p-4">
                                    <div class名称="space-y-3">
                                        <div class名称="flex items-center gap-2">
                                            <CheckCircle2 class名称="h-5 w-5 text-green-500" />
                                            <p class名称="text-sm font-medium">Next Version Available</p>
                                        </div>
                                        <div class名称="space-y-1">
                                            <p class名称="text-2xl font-bold text-primary">{k3sNextVersionInfo.version}</p>
                                            <p class名称="text-xs text-muted-foreground">
                                                Channel: <Link target="_blank" href={k3sNextVersionInfo.channelUrl}>{k3sNextVersionInfo.channelUrl}</Link>
                                            </p>
                                        </div>
                                        <Button
                                            disabled={loading}
                                            size="sm"
                                            class名称="w-full gap-2"
                                            onClick={handleUpgrade}
                                        >
                                            <RefreshCw class名称="h-4 w-4" />
                                            Upgrade to {k3sNextVersionInfo.version}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {k3sNextVersionInfo === undefined && (
                                <Alert>
                                    <Alert描述>
                                        Your cluster is running the latest available K3s version wich is compatible with QuickStack.
                                    </Alert描述>
                                </Alert>
                            )}
                        </>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
