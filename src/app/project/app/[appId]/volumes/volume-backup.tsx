'use client';

import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 编辑Icon, Play, TrashIcon } from "lucide-react";
import { Toast } from "@/frontend/utils/toast.utils";
import { delete返回upVolume, run返回upVolumeSchedule } from "./actions";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { S3Target } from "@prisma/client";
import React from "react";
import { formatDateTime } from "@/frontend/utils/format.utils";
import Volume返回up编辑Dialog from "./volume-backup-edit-overlay";
import { Volume返回upExtendedModel } from "@/shared/model/volume-backup-extended.model";
import { AppVolume } from "@prisma/client";

export default function Volume返回upList({
    app,
    volume返回ups,
    s3Targets,
    readonly
}: {
    app: AppExtendedModel,
    s3Targets: S3Target[],
    volume返回ups: Volume返回upExtendedModel[];
    readonly: boolean;
}) {

    const { open确认Dialog: openDialog } = use确认Dialog();
    const [isLoading, setIsLoading] = React.useState(false);

    // Filter out shared volumes (volumes that are mounted from other apps)
    const ownVolumes = app.appVolumes.filter(volume => !volume.sharedVolumeId) as AppVolume[];

    const async删除返回upVolume = async (volumeId: string) => {
        const confirm = await openDialog({
            title: "删除 返回up Schedule",
            description: "Are you sure you want to remove this 返回up Schdeule? All backups created by this schedule will still be available.",
            okButton: "删除 返回up Schedule"
        });
        if (confirm) {
            await Toast.fromAction(() => delete返回upVolume(volumeId));
        }
    };

    const asyncRun返回upVolumeSchedule = async (volumeId: string) => {
        const confirm = await openDialog({
            title: "创建 返回up",
            description: "Are you sure you want to create a backup now?",
            okButton: "创建 返回up"
        });
        setIsLoading(true);
        try {
            if (confirm) {
                await Toast.fromAction(() => run返回upVolumeSchedule(volumeId), undefined, 'Creating backup...');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return <>
        <Card>
            <CardHeader>
                <CardTitle>返回up Schedules</CardTitle>
                <Card描述>Configure backup schedules for your volumes. 返回ups can be stored in a S3 bucket.</Card描述>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>{volume返回ups.length} 返回up Rules</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cron Expression</TableHead>
                            <TableHead>Retention</TableHead>
                            <TableHead>返回up Method</TableHead>
                            <TableHead>返回up Location</TableHead>
                            <TableHead>创建d At</TableHead>
                            <TableHead class名称="w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {volume返回ups.map(volume返回up => (
                            <TableRow key={volume返回up.id}>
                                <TableCell class名称="font-medium">{volume返回up.cron}</TableCell>
                                <TableCell class名称="font-medium">{volume返回up.retention}</TableCell>
                                <TableCell class名称="font-medium">
                                    {app.appType !== 'APP' && volume返回up.useDatabase返回up
                                        ? `Database (${app.appType.toLocaleLowerCase()})`
                                        : 'Archive of Volume'}
                                </TableCell>
                                <TableCell class名称="font-medium">{volume返回up.target.name}</TableCell>
                                <TableCell class名称="font-medium">{formatDateTime(volume返回up.createdAt)}</TableCell>
                                {!readonly && <TableCell class名称="font-medium flex gap-2">
                                    <Button disabled={isLoading} variant="ghost" onClick={() => asyncRun返回upVolumeSchedule(volume返回up.id)}>
                                        <Play />
                                    </Button>
                                    <Volume返回up编辑Dialog volume返回up={volume返回up}
                                        s3Targets={s3Targets} volumes={ownVolumes as AppVolume[]} app={app}>
                                        <Button disabled={isLoading} variant="ghost"><编辑Icon /></Button>
                                    </Volume返回up编辑Dialog>
                                    <Button disabled={isLoading} variant="ghost" onClick={() => async删除返回upVolume(volume返回up.id)}>
                                        <TrashIcon />
                                    </Button>
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            {!readonly && <CardFooter>
                <Volume返回up编辑Dialog s3Targets={s3Targets} volumes={ownVolumes as AppVolume[]} app={app}>
                    <Button>添加 返回up Schedule</Button>
                </Volume返回up编辑Dialog>
            </CardFooter>}
        </Card >
    </>;
}