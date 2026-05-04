'use client';

import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, 编辑Icon, TrashIcon } from "lucide-react";
import Dialog编辑Dialog from "./s3-target-edit-overlay";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import { AppVolume, S3Target } from "@prisma/client";
import React from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { SimpleDataTable } from "@/components/custom/simple-data-table";
import { formatDateTime } from "@/frontend/utils/format.utils";
import S3Target编辑Overlay from "./s3-target-edit-overlay";
import { deleteVolume } from "@/app/project/app/[appId]/volumes/actions";
import { deleteS3Target } from "./actions";

export default function S3TargetsTable({ targets }: {
    targets: S3Target[]
}) {

    const { open确认Dialog: openDialog } = use确认Dialog();

    const async删除Target = async (id: string) => {
        const confirm = await openDialog({
            title: "删除 S3 Target",
            description: "Do you really want to delete this S3 Target?",
            okButton: "删除 S3 Target"
        });
        if (confirm) {
            await Toast.fromAction(() => deleteS3Target(id));
        }
    };

    return <>
        <SimpleDataTable columns={[
            ['id', 'ID', false],
            ['name', '名称', true],
            ["createdAt", "创建d At", true, (item) => formatDateTime(item.createdAt)],
            ["updatedAt", "Updated At", false, (item) => formatDateTime(item.updatedAt)],
        ]}
            data={targets}
            actionCol={(item) =>
                <>
                    <div class名称="flex">
                        <div class名称="flex-1"></div>
                        <Dialog编辑Dialog target={item}>
                            <Button variant="ghost"><编辑Icon /></Button>
                        </Dialog编辑Dialog>
                        <Button variant="ghost" onClick={() => async删除Target(item.id)}>
                            <TrashIcon />
                        </Button>
                    </div>
                </>}
        />
    </>;
}