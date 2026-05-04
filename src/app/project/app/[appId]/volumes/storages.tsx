'use client';

import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, 编辑Icon, Folder, TrashIcon, Share2, Unlink2, Unlink } from "lucide-react";
import Dialog编辑Dialog from "./storage-edit-overlay";
import SharedStorage编辑Dialog from "./shared-storage-edit-overlay";
import { Toast } from "@/frontend/utils/toast.utils";
import { deleteVolume, downloadPvcData, getPvcUsage, openFileBrowserForVolume } from "./actions";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { AppVolume } from "@prisma/client";
import React from "react";
import { KubeObject名称Utils } from "@/server/utils/kube-object-name.utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Code } from "@/components/custom/code";
import { Label } from "@/components/ui/label";
import { KubeSizeConverter } from "@/shared/utils/kubernetes-size-converter.utils";
import { Progress } from "@/components/ui/progress";
import { NodeInfoModel } from "@/shared/model/node-info.model";

type AppVolumeWithCapacity = (AppVolume & {
    usedBytes?: number;
    capacityBytes?: number;
    usedPercentage?: number;
});

export default function StorageList({ app, readonly, nodesInfo }: {
    app: AppExtendedModel;
    nodesInfo: NodeInfoModel[];
    readonly: boolean;
}) {

    const [volumesWithStorage, setVolumesWithStorage] = React.useState<AppVolumeWithCapacity[]>(app.appVolumes as AppVolumeWithCapacity[]);
    const [isLoading, setIsLoading] = React.useState(false);

    const loadAndMapStorageData = async () => {

        const response = (await getPvcUsage(app.id, app.projectId));

        if (response.status === 'success' && response.data) {
            const mappedVolumeData = [...app.appVolumes] as AppVolumeWithCapacity[];
            for (let item of mappedVolumeData) {
                const volume = response.data.find(x => x.pvc名称 === KubeObject名称Utils.toPvc名称(item.sharedVolumeId || item.id));
                if (volume) {
                    item.usedBytes = volume.usedBytes;
                    item.capacityBytes = KubeSizeConverter.fromMegabytesToBytes(item.size);
                    item.usedPercentage = Math.round(volume.usedBytes / item.capacityBytes * 100);
                }
            }
            setVolumesWithStorage(mappedVolumeData);
        } else {
            console.error(response);
        }
    }

    React.useEffect(() => {
        loadAndMapStorageData();
    }, [app.appVolumes, app]);

    const { open确认Dialog: openDialog } = use确认Dialog();

    const async删除Volume = async (volumeId: string, isBaseVolume: boolean) => {
        try {
            const confirm = await openDialog({
                title: isBaseVolume ? "删除 Volume" : "Detach Volume",
                description: isBaseVolume ? "The volume will be removed and the Data will be lost. The changes will take effect, after you deploy the app. Are you sure you want to remove this volume?" :
                    "The volume will be detached from the app. The data will remain on the cluster and can be re-attached later. The changes will take effect, after you deploy the app. Are you sure you want to detach this volume?",
                okButton: isBaseVolume ? "删除 Volume" : "Detach Volume"
            });
            if (confirm) {
                setIsLoading(true);
                await Toast.fromAction(() => deleteVolume(volumeId));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const asyncDownloadPvcData = async (volumeId: string) => {
        try {
            const confirm = await openDialog({
                title: "Download Volume Data",
                description: "The volume data will be zipped and downloaded. Depending on the size of the volume this can take a while. Are you sure you want to download the volume data?",
                okButton: "Download"
            });
            if (confirm) {
                setIsLoading(true);
                await Toast.fromAction(() => downloadPvcData(volumeId)).then(x => {
                    if (x.status === 'success' && x.data) {
                        window.open('/api/volume-data-download?file名称=' + x.data);
                    }
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    const openFileBrowserForVolumeAsync = async (volumeId: string) => {

        try {
            const confirm = await openDialog({
                title: "Open File Browser",
                description: "To view the Files of the volume, your app has to be stopped. The file browser will be opened in a new tab. Are you sure you want to open the file browser?",
                okButton: "Stop App and Open File Browser"
            });
            if (!confirm) {
                return;
            }
            setIsLoading(true);
            const fileBrowserStartResult = await Toast.fromAction(() => openFileBrowserForVolume(volumeId), undefined, 'Starting file browser...')
            if (fileBrowserStartResult.status !== 'success' || !fileBrowserStartResult.data) {
                return;
            }
            await openDialog({
                title: "File Browser Ready",
                description: <>
                    The File Browser is ready and can be opened in a new tab. <br />
                    Use the following credentials to login:
                    <div class名称="pt-3 grid grid-cols-1 gap-1">
                        <Label>用户名</Label>
                        <div> <Code>quickstack</Code></div>
                    </div>
                    <div class名称="pt-3 pb-4 grid grid-cols-1 gap-1">
                        <Label>密码</Label>
                        <div><Code>{fileBrowserStartResult.data.password}</Code></div>
                    </div>
                    <div>
                        <Button variant='outline' onClick={() => window.open(fileBrowserStartResult.data!.url, '_blank')}>Open File Browser</Button>
                    </div>
                </>,
                okButton: '',
                cancelButton: "关闭"
            });
        } finally {
            setIsLoading(false);
        }
    }

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Volumes</CardTitle>
                <Card描述>添加 one or more volumes to to configure persistent storage within your container.</Card描述>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>{app.appVolumes.length} Storage</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mount Path</TableHead>
                            <TableHead>Storage Size</TableHead>
                            <TableHead>Storage Used</TableHead>
                            <TableHead>Storage Class</TableHead>
                            <TableHead>Access Mode</TableHead>
                            <TableHead>Shared</TableHead>
                            <TableHead class名称="w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {volumesWithStorage.map(volume => (
                            <TableRow key={volume.containerMountPath}>
                                <TableCell class名称="font-medium">{volume.containerMountPath}</TableCell>
                                <TableCell class名称="font-medium">{volume.size} MB</TableCell>
                                <TableCell class名称="font-medium space-y-2">
                                    {volume.usedPercentage && <>
                                        <Progress value={volume.usedPercentage}
                                            color={volume.usedPercentage >= 90 ? 'red' : (volume.usedPercentage >= 80 ? 'orange' : undefined)} />
                                        <div class名称='text-xs text-slate-500'>
                                            {KubeSizeConverter.convertBytesToReadableSize(volume.usedBytes!)} used ({volume.usedPercentage}%)
                                        </div>
                                    </>}
                                </TableCell>
                                <TableCell class名称="font-medium capitalize">{volume.storageClass名称?.replace('-', ' ')}</TableCell>
                                <TableCell class名称="font-medium">{volume.accessMode}</TableCell>
                                <TableCell class名称="font-medium">
                                    {volume.shareWithOtherApps && (
                                        <TooltipProvider>
                                            <Tooltip delayDuration={200}>
                                                <TooltipTrigger>
                                                    <span class名称="px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800 inline-flex items-center gap-1">
                                                        <Share2 class名称="h-3 w-3" />
                                                        Shareable
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>This volume can be mounted by other apps in this project</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                    {volume.sharedVolumeId && (
                                        <TooltipProvider>
                                            <Tooltip delayDuration={200}>
                                                <TooltipTrigger>
                                                    <span class名称="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 inline-flex items-center gap-1">
                                                        <Share2 class名称="h-3 w-3" />
                                                        Shared
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>This volume is mounted from another app's volume</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </TableCell>
                                <TableCell class名称="font-medium flex gap-2">
                                    {!volume.sharedVolumeId && <>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={200}>
                                                <TooltipTrigger>
                                                    <Button variant="ghost" onClick={() => asyncDownloadPvcData(volume.id)} disabled={isLoading}>
                                                        <Download />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Download volume content</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        {!readonly && <TooltipProvider>
                                            <Tooltip delayDuration={200}>
                                                <TooltipTrigger>
                                                    <Button variant="ghost" onClick={() => openFileBrowserForVolumeAsync(volume.id)} disabled={isLoading}>
                                                        <Folder />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>View content of Volume</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>}
                                    </>}
                                    {/*<StorageRestoreDialog app={app} volume={volume}>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={200}>
                                                <TooltipTrigger>
                                                    <Button variant="ghost" disabled={isLoading}>
                                                        <Upload />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Restore backup from zip</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </StorageRestoreDialog>*/}
                                    {!readonly && <>
                                        {volume.sharedVolumeId ? (
                                            <TooltipProvider>
                                                <Tooltip delayDuration={200}>
                                                    <TooltipTrigger>
                                                        <Button variant="ghost" disabled={true}><编辑Icon /></Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Shared volumes cannot be edited (size and storage class are inherited)</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <Dialog编辑Dialog app={app} volume={volume} nodesInfo={nodesInfo}>
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={200}>
                                                        <TooltipTrigger>
                                                            <Button variant="ghost" disabled={isLoading}><编辑Icon /></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>编辑 volume settings</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Dialog编辑Dialog>
                                        )}
                                        <TooltipProvider>
                                            <Tooltip delayDuration={200}>
                                                <TooltipTrigger>
                                                    <Button variant="ghost" onClick={() => async删除Volume(volume.id, !volume.sharedVolumeId)} disabled={isLoading}>
                                                        {volume.sharedVolumeId ? <Unlink /> : <TrashIcon />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{volume.sharedVolumeId ? 'Detach Volume' : '删除 Volume'}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            {!readonly && <CardFooter class名称="flex gap-2">
                <Dialog编辑Dialog app={app} nodesInfo={nodesInfo}>
                    <Button>添加 Volume</Button>
                </Dialog编辑Dialog>
                <SharedStorage编辑Dialog app={app}>
                    <Button variant="outline">添加 Shared Volume</Button>
                </SharedStorage编辑Dialog>
            </CardFooter>}
        </Card >
    </>;
}