'use client'

import { Dialog, DialogContent, Dialog描述, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useFormState } from 'react-dom'
import { useEffect, useState } from "react";
import { FormUtils } from "@/frontend/utils/form.utilts";
import { 提交Button } from "@/components/custom/submit-button";
import { AppVolume编辑Model, appVolume编辑ZodModel } from "@/shared/model/volume-edit.model"
import { ServerActionResult } from "@/shared/model/server-action-error-return.model"
import { saveVolume, getShareableVolumes } from "./actions"
import { toast } from "sonner"
import { AppExtendedModel } from "@/shared/model/app-extended.model"
import SelectFormField from "@/components/custom/select-form-field"
import { Alert, Alert描述 } from "@/components/ui/alert"
import { Info } from "lucide-react"

type ShareableVolume = {
    id: string;
    containerMountPath: string;
    size: number;
    storageClass名称: string;
    accessMode: string;
    app: { name: string };
};

export default function SharedStorage编辑Dialog({ children, app }: {
    children: React.ReactNode;
    app: AppExtendedModel;
}) {

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [shareableVolumes, setShareableVolumes] = useState<ShareableVolume[]>([]);
    const [isLoadingVolumes, setIsLoadingVolumes] = useState(false);

    const form = useForm<AppVolume编辑Model>({
        resolver: zodResolver(appVolume编辑ZodModel),
        defaultValues: {
            containerMountPath: '',
            size: 0,
            accessMode: 'ReadWriteMany',
            storageClass名称: 'longhorn',
            sharedVolumeId: undefined,
        }
    });

    const [state, formAction] = useFormState((state: ServerActionResult<any, any>, payload: AppVolume编辑Model) =>
        saveVolume(state, {
            ...payload,
            appId: app.id,
            id: undefined
        }), FormUtils.getInitialFormState<typeof appVolume编辑ZodModel>());

    // Fetch shareable volumes when dialog opens
    useEffect(() => {
        if (isOpen) {
            setIsLoadingVolumes(true);
            getShareableVolumes(app.id).then(result => {
                if (result.status === 'success' && result.data) {
                    const already添加edSharedVolumes = app.appVolumes
                        .filter(v => !!v.sharedVolumeId)
                        .map(v => v.sharedVolumeId);
                    setShareableVolumes(result.data.filter(v => !already添加edSharedVolumes.includes(v.id)));
                } else {
                    setShareableVolumes([]);
                    toast.error('An error occurred while fetching shareable volumes');
                }
                setIsLoadingVolumes(false);
            });
        }
    }, [isOpen, app.id]);

    // Watch selected volume and auto-fill fields
    const watchedSharedVolumeId = form.watch("sharedVolumeId");
    useEffect(() => {
        if (watchedSharedVolumeId) {
            const selectedVolume = shareableVolumes.find(v => v.id === watchedSharedVolumeId);
            if (selectedVolume) {
                form.setValue("size", selectedVolume.size);
                form.setValue("accessMode", selectedVolume.accessMode);
                form.setValue("storageClass名称", selectedVolume.storageClass名称 as 'longhorn' | 'local-path');
            }
        }
    }, [watchedSharedVolumeId, shareableVolumes]);

    useEffect(() => {
        if (state.status === 'success') {
            form.reset();
            toast.success('Shared volume mounted successfully', {
                description: "Click \"deploy\" to apply the changes to your app.",
            });
            setIsOpen(false);
        }
        FormUtils.mapValidationErrorsToForm<typeof appVolume编辑ZodModel>(state, form);
    }, [state]);

    return (
        <>
            <div onClick={() => setIsOpen(true)}>
                {children}
            </div>
            <Dialog open={!!isOpen} onOpenChange={(isOpened) => setIsOpen(false)}>
                <DialogContent class名称="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Mount Shared Volume</DialogTitle>
                        <Dialog描述>
                            Mount an existing ReadWriteMany volume from another app in this project.
                        </Dialog描述>
                    </DialogHeader>
                    <Form {...form}>
                        <form action={(e) => form.handle提交((data) => {
                            return formAction(data);
                        })()}>
                            <div class名称="space-y-4">
                                {isLoadingVolumes ? (
                                    <div class名称="text-sm text-muted-foreground">Loading shareable volumes...</div>
                                ) : shareableVolumes.length === 0 ? (
                                    <Alert>
                                        <Info class名称="h-4 w-4" />
                                        <Alert描述>
                                            No shareable volumes available. 创建 a ReadWriteMany volume in another app and enable sharing first.
                                        </Alert描述>
                                    </Alert>
                                ) : (
                                    <>
                                        <SelectFormField
                                            form={form}
                                            name="sharedVolumeId"
                                            label="Select Shared Volume"
                                            values={shareableVolumes.map(v => [
                                                v.id,
                                                `${v.app.name} - ${v.containerMountPath} (${v.size}MB)`
                                            ])}
                                            placeholder="Select volume to share..."
                                        />

                                        <FormField
                                            control={form.control}
                                            name="containerMountPath"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Mount Path in This Container</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="ex. /shared-data" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div class名称="text-sm text-muted-foreground space-y-1">
                                            <p><strong>Size:</strong> {form.watch("size")} MB (inherited from shared volume)</p>
                                            <p><strong>Storage Class:</strong> {form.watch("storageClass名称")} (inherited from shared volume)</p>
                                        </div>
                                    </>
                                )}

                                <p class名称="text-red-500">{state.message}</p>
                                {shareableVolumes.length > 0 && <提交Button>Mount Shared Volume</提交Button>}
                            </div>
                        </form>
                    </Form >
                </DialogContent>
            </Dialog>
        </>
    )
}
