'use client';

import { 提交Button } from "@/components/custom/submit-button";
import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormState } from "react-dom";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listSystem返回ups, runSystem返回upNow, setSystem返回upLocation, uploadAndRestoreSystem返回up, downloadSystem返回up } from "./actions";
import { S3Target } from "@prisma/client";
import { System返回upLocation设置Model, system返回upLocation设置ZodModel } from "@/shared/model/system-backup-location-settings.model";
import SelectFormField from "@/components/custom/select-form-field";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, Dialog描述, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileArchive, Loader2, Play, Upload, Download, AlertTriangle } from "lucide-react";
import { formatBytes, formatDate, formatDateTime } from "@/frontend/utils/format.utils";
import { Toast } from "@/frontend/utils/toast.utils";
import { Constants } from "@/shared/utils/constants";
import { Input } from "@/components/ui/input";
import { Alert, Alert描述 } from "@/components/ui/alert";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { Separator } from "@/components/ui/separator";

const DEACTIVATED_VALUE = Constants.QS_SYSTEM_BACKUP_DEACTIVATED;

export default function QuickStackSystem返回up设置({
    system返回upLocation,
    s3Targets
}: {
    system返回upLocation: string;
    s3Targets: S3Target[];
}) {
    const [show返回upsDialog, setShow返回upsDialog] = useState(false);
    const [backups, set返回ups] = useState<any[]>([]);
    const [loading返回ups, setLoading返回ups] = useState(false);
    const [running返回up, setRunning返回up] = useState(false);
    const [uploading返回up, setUploading返回up] = useState(false);
    const [downloading返回up, setDownloading返回up] = useState<string | null>(null);
    const confirmDialog = use确认Dialog();

    const form = useForm<System返回upLocation设置Model>({
        resolver: zodResolver(system返回upLocation设置ZodModel),
        defaultValues: {
            system返回upLocation: system返回upLocation || DEACTIVATED_VALUE,
        }
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>,
        payload: System返回upLocation设置Model) =>
        setSystem返回upLocation(state, payload),
        FormUtils.getInitialFormState<typeof system返回upLocation设置ZodModel>());

    useEffect(() => {
        if (state.status === 'success') {
            toast.success('System backup settings updated successfully.');
        }
        FormUtils.mapValidationErrorsToForm<typeof system返回upLocation设置ZodModel>(state, form)
    }, [state]);

    const handleView返回ups = async () => {
        setShow返回upsDialog(true);
        setLoading返回ups(true);
        try {
            const result = await listSystem返回ups();
            if (result.status === 'success') {
                set返回ups(result.data || []);
            } else {
                toast.error(result.message || 'Failed to load backups');
            }
        } catch (error) {
            toast.error('Failed to load backups');
        } finally {
            setLoading返回ups(false);
        }
    };

    const handleRun返回up = async () => {
        setRunning返回up(true);
        try {
            await Toast.fromAction(() => runSystem返回upNow());
        } finally {
            setRunning返回up(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const confirmed = await confirmDialog.open确认Dialog({
            title: 'Restore System 返回up',
            description: 'This will replace your current database with the one from the backup file. This action cannot be undone. Make sure you have a recent backup before proceeding. You will need to restart QuickStack after restoration.',
            okButton: 'Restore 返回up',
            cancelButton: '取消'
        });

        if (!confirmed) {
            event.target.value = ''; // Reset file input
            return;
        }

        setUploading返回up(true);
        try {
            const formData = new FormData();
            formData.append('backupFile', file);

            const result = await uploadAndRestoreSystem返回up(formData);

            if (result.status === 'success') {
                toast.success(result.message || '返回up restored successfully. Please restart QuickStack.');
                setShow返回upsDialog(false);
            } else {
                toast.error(result.message || 'Failed to restore backup');
            }
        } catch (error) {
            toast.error('Failed to restore backup');
        } finally {
            setUploading返回up(false);
            event.target.value = ''; // Reset file input
        }
    };

    const handleDownload返回up = async (backupKey: string) => {
        setDownloading返回up(backupKey);
        try {
            await Toast.fromAction(() => downloadSystem返回up(backupKey)).then(x => {
                if (x.status === 'success' && x.data) {
                    window.open('/api/volume-data-download?file名称=' + x.data);
                }
            });
        } finally {
            setDownloading返回up(null);
        }
    };

    return <>
        <Card>
            <CardHeader>
                <CardTitle>System 返回up Location</CardTitle>
                <Card描述>
                    Configure where QuickStack system files should be backed up (App configurations, QuickStack settings...).
                    Select an S3 storage target to enable automatic system backups, or deactivate to disable system backups.
                </Card描述>
            </CardHeader>
            <CardContent class名称="space-y-6">
                <Form {...form}>
                    <form action={(e) => form.handle提交((data) => {
                        return formAction(data);
                    })()}>
                        <div class名称="space-y-4">
                            <SelectFormField
                                form={form}
                                name="system返回upLocation"
                                label="System 返回up Location"
                                form描述={<>
                                    S3 Storage Locations can be configured <span class名称="underline"><Link href="/settings/s3-targets">here</Link></span>.
                                </>}
                                values={[
                                    [DEACTIVATED_VALUE, Constants.QS_SYSTEM_BACKUP_DEACTIVATED],
                                    ...s3Targets.map((target) =>
                                        [target.id, `S3: ${target.name}`])
                                ] as [string, string][]}
                            />
                            <div class名称="flex items-center gap-4">
                                <提交Button>保存 设置</提交Button>
                                {state?.message && <p class名称="text-red-500 text-sm">{state.message}</p>}
                            </div>
                        </div>
                    </form>
                </Form>

                <Separator />

                <div class名称="space-y-4">
                    <h4 class名称="text-sm font-medium">返回up Operations</h4>
                    <div class名称="flex flex-wrap gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleView返回ups}
                            disabled={system返回upLocation === DEACTIVATED_VALUE || !system返回upLocation}
                        >
                            <FileArchive class名称="mr-2 h-4 w-4" />
                            View & Restore 返回ups
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleRun返回up}
                            disabled={system返回upLocation === DEACTIVATED_VALUE || !system返回upLocation || running返回up}
                        >
                            {running返回up ? (
                                <Loader2 class名称="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Play class名称="mr-2 h-4 w-4" />
                            )}
                            Run 返回up Now
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Dialog open={show返回upsDialog} onOpenChange={setShow返回upsDialog}>
            <DialogContent class名称="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>System 返回ups</DialogTitle>
                    <Dialog描述>
                        All available QuickStack system backups from your configured S3 storage
                    </Dialog描述>
                </DialogHeader>

                <Alert>
                    <AlertTriangle class名称="h-4 w-4" />
                    <Alert描述>
                        <div class名称="space-y-2">
                            <p class名称="font-semibold">Upload and Restore 返回up</p>
                            <p class名称="text-sm">
                                You can upload a system backup file (.tar.gz) to restore your QuickStack instance.
                                The system will automatically extract and replace the database. You will need to restart QuickStack after restoration.
                            </p>
                            <div class名称="flex items-center gap-2 pt-2">
                                <Input
                                    type="file"
                                    accept=".tar.gz,.tgz"
                                    onChange={handleFileUpload}
                                    disabled={uploading返回up}
                                    class名称="max-w-md"
                                />
                                {uploading返回up && (
                                    <div class名称="flex items-center gap-2 text-sm">
                                        <Loader2 class名称="h-4 w-4 animate-spin" />
                                        Restoring backup...
                                    </div>
                                )}
                            </div>
                        </div>
                    </Alert描述>
                </Alert>

                {loading返回ups ? (
                    <div class名称="flex items-center justify-center py-8">
                        <Loader2 class名称="h-8 w-8 animate-spin" />
                    </div>
                ) : backups.length === 0 ? (
                    <div class名称="text-center py-8 text-muted-foreground">
                        No backups found
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>返回up Date</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>S3 Key</TableHead>
                                <TableHead class名称="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {backups.map((backup: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{formatDateTime(backup.date)}</TableCell>
                                    <TableCell>{formatBytes(backup.sizeBytes)}</TableCell>
                                    <TableCell class名称="font-mono text-xs">{backup.key}</TableCell>
                                    <TableCell class名称="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownload返回up(backup.key)}
                                            disabled={downloading返回up === backup.key}
                                        >
                                            {downloading返回up === backup.key ? (
                                                <Loader2 class名称="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Download class名称="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>

    </>;
}
