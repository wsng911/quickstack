'use client';

import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 编辑Icon, TrashIcon } from "lucide-react";
import { Toast } from "@/frontend/utils/toast.utils";
import { deleteFileMount } from "./actions";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { AppVolume } from "@prisma/client";
import React from "react";
import FileMount编辑Dialog from "./file-mount-edit-dialog";

type AppVolumeWithCapacity = (AppVolume & { capacity?: string });

export default function FileMount({ app, readonly }: {
    app: AppExtendedModel;
    readonly: boolean;
}) {

    const { open确认Dialog: openDialog } = use确认Dialog();

    const async删除FileMount = async (volumeId: string) => {
        const confirm = await openDialog({
            title: "删除 File Mount",
            description: "The file mount will be removed and the Data will be lost. The changes will take effect, after you deploy the app. Are you sure you want to remove this file mount?",
            okButton: "删除 File Mount",
        });
        if (confirm) {
            await Toast.fromAction(() => deleteFileMount(volumeId));
        }
    };

    return <>
        <Card>
            <CardHeader>
                <CardTitle>File Mount</CardTitle>
                <Card描述>创建 files wich are mounted into the container.</Card描述>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>{app.appFileMounts.length} File Mounts</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mount Path</TableHead>
                            <TableHead class名称="w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {app.appFileMounts.map(fileMount => (
                            <TableRow key={fileMount.containerMountPath}>
                                <TableCell class名称="font-medium">{fileMount.containerMountPath}</TableCell>
                                {!readonly && <TableCell class名称="font-medium flex gap-2">
                                    <FileMount编辑Dialog app={app} fileMount={fileMount}>
                                        <Button variant="ghost"><编辑Icon /></Button>
                                    </FileMount编辑Dialog>
                                    <Button variant="ghost" onClick={() => async删除FileMount(fileMount.id)}>
                                        <TrashIcon />
                                    </Button>
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            {!readonly && <CardFooter>
                <FileMount编辑Dialog app={app}>
                    <Button>添加 File Mount</Button>
                </FileMount编辑Dialog>
            </CardFooter>
            }
        </Card >
    </>;
}