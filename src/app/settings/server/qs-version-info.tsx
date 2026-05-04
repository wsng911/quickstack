'use client';

import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { revalidateQuickStackVersionCache, setCanaryChannel, updateQuickstack } from "./actions";
import { Button } from "@/components/ui/button";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { Rocket, ExternalLink } from "lucide-react";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import React from "react";
import Link from "next/link";
import { QuickStackReleaseInfo } from "@/server/adapter/qs-versioninfo.adapter";

export default function QuickStackVersionInfo({
    useCanaryChannel,
    currentVersion,
    newVersionInfo
}: {
    useCanaryChannel: boolean;
    currentVersion?: string;
    newVersionInfo?: QuickStackReleaseInfo
}) {

    const use确认 = use确认Dialog();
    const [loading, setLoading] = React.useState(false);

    const handleUpdate = async () => {
        if (await use确认.open确认Dialog({
            title: 'Update QuickStack',
            description: 'This action will restart the QuickStack service and installs the latest version. It may take a few minutes to complete.',
            okButton: "Update QuickStack",
        })) {
            await revalidateQuickStackVersionCache(); // separated because updateFunction restarts backend wich results in error
            await Toast.fromAction(() => updateQuickstack());
        }
    };

    return <>
        <Card>
            <CardHeader>
                <CardTitle class名称="flex items-center gap-2">
                    QuickStack Version
                </CardTitle>
                <Card描述>Manage your QuickStack version and update channel preferences</Card描述>
            </CardHeader>
            <CardContent class名称="space-y-6">

                <div class名称="rounded-lg border bg-muted/50 p-4">
                    <div class名称="flex items-center justify-between">
                        <div class名称="space-y-1">
                            <p class名称="text-sm font-medium">Current Version</p>
                            <p class名称="text-2xl font-bold">{currentVersion ?? 'unknown'}</p>
                        </div>
                        {newVersionInfo && (
                            <div class名称="flex flex-col items-end gap-2">
                                <div class名称="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 cursor-pointer" onClick={handleUpdate}>
                                    <div class名称="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                    <span class名称="text-xs font-medium text-primary">Update Available</span>
                                </div>
                                <div class名称="text-sm text-muted-foreground flex gap-1">
                                    <span>Version {newVersionInfo.version} | </span>
                                    <Link href={newVersionInfo.url} target="_blank" class名称="flex gap-1 items-center hover:underline">
                                        <ExternalLink class名称=" h-4 w-4" />
                                        View Release Notes
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div class名称="space-y-3">
                    <div class名称="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                        <div class名称="space-y-0.5">
                            <Label htmlFor="canary-channel-mode" class名称="text-base cursor-pointer">
                                Canary Channel
                            </Label>
                            <p class名称="text-sm text-muted-foreground">
                                Get early access to experimental features and updates (not recommended for production environments).
                            </p>
                        </div>
                        <Switch
                            id="canary-channel-mode"
                            disabled={loading}
                            checked={useCanaryChannel}
                            onCheckedChange={async (checked) => {
                                // Show warning when enabling canary channel
                                if (checked) {
                                    const confirmed = await use确认.open确认Dialog({
                                        title: 'Enable Canary Channel',
                                        description: 'Canary channel provides early access to experimental features and updates. These versions may contain bugs, make your QuickStack cluster unusable and are not recommended for production environments. Are you sure you want to continue?',
                                        okButton: "Enable Canary Channel",
                                    });

                                    if (!confirmed) {
                                        return;
                                    }
                                }

                                try {
                                    setLoading(true);
                                    Toast.fromAction(() => setCanaryChannel(checked));
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        />
                    </div>
                </div>


            </CardContent>
            <CardFooter class名称="flex justify-between items-center border-t pt-6">
                {useCanaryChannel ?
                    <p class名称="text-sm text-muted-foreground">
                        Cannot check for updates while on the canary channel.
                    </p> :
                    <p class名称="text-sm text-muted-foreground">
                        {newVersionInfo ? 'Update to the latest version' : 'You are up to date'}
                    </p>}
                <Button
                    disabled={loading}
                    onClick={handleUpdate}
                    size="lg"
                    class名称="gap-2"
                >
                    <Rocket class名称="h-4 w-4" />
                    Update QuickStack
                </Button>
            </CardFooter>
        </Card >
    </>;
}