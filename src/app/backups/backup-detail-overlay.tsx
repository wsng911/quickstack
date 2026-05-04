import {
    Dialog,
    DialogContent,
    Dialog描述,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import React from "react";
import { 返回upInfoModel } from "@/shared/model/backup-info.model";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KubeSizeConverter } from "@/shared/utils/kubernetes-size-converter.utils";
import { formatDateTime } from "@/frontend/utils/format.utils";
import { delete返回up, download返回up } from "./actions";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";

export function 返回upDetailDialog({
    backupInfo,
    children
}: {
    backupInfo: 返回upInfoModel;
    children: React.ReactNode;
}) {

    const { open确认Dialog } = use确认Dialog();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);

    const asyncDownloadPvcData = async (s3Key: string) => {
        try {
            setIsLoading(true);
            await Toast.fromAction(() => download返回up(backupInfo.s3TargetId, s3Key)).then(x => {
                if (x.status === 'success' && x.data) {
                    window.open('/api/volume-data-download?file名称=' + x.data);
                }
            });
        } finally {
            setIsLoading(false);
        }
    }

    const async删除返回up = async (s3Key: string) => {
        if (await open确认Dialog({
            title: '删除 返回up',
            description: 'This action deletes the backup from the storage. This action cannot be undone.',
            okButton: '删除'
        })) {
            await Toast.fromAction(() => delete返回up(backupInfo.s3TargetId, s3Key));
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(isO) => {
            setIsOpen(isO);
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent class名称="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>返回ups</DialogTitle>
                    <Dialog描述>
                        <span class名称="font-semibold">App:</span> {backupInfo.app名称}<br />
                        <span class名称="font-semibold">Mount Path:</span> {backupInfo.mountPath}<br />
                        For this backup schedule the latest {backupInfo.backupRetention} versions are kept.
                    </Dialog描述>
                </DialogHeader>
                <ScrollArea class名称="max-h-[70vh]">
                    <Table>
                        <TableCaption>{backupInfo.backups.length} 返回ups</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {backupInfo.backups.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{formatDateTime(item.backupDate, true)}</TableCell>
                                    <TableCell>{item.sizeBytes ? KubeSizeConverter.convertBytesToReadableSize(item.sizeBytes) : 'unknown'}</TableCell>
                                    <TableCell class名称="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => asyncDownloadPvcData(item.key)} disabled={isLoading}>
                                            <Download />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => async删除返回up(item.key)} disabled={isLoading}>
                                            <Trash2 />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
