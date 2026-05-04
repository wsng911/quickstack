'use client';

import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 编辑Icon, Eye, TrashIcon } from "lucide-react";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import React from "react";
import FileMount编辑Dialog from "./basic-auth-edit-dialog";
import BasicAuth编辑Dialog from "./basic-auth-edit-dialog";
import { deleteBasicAuth } from "./actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function BasicAuth({ app, readonly }: {
    app: AppExtendedModel;
    readonly: boolean;
}) {

    const { open确认Dialog: openDialog } = use确认Dialog();

    const async删除 = async (volumeId: string) => {
        const confirm = await openDialog({
            title: "删除 Auth Credential",
            description: "Are you sure you want to remove this auth credential? The changes will take effect, after you deploy the app. ",
            okButton: "删除 Auth Credential",
        });
        if (confirm) {
            await Toast.fromAction(() => deleteBasicAuth(volumeId));
        }
    };

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Basic Authentication</CardTitle>
                <Card描述>Configure basic authentication for your app. This will add a basic authentication layer in front of your app.</Card描述>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>{app.appBasicAuths.length} Auth Credentials</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>用户名</TableHead>
                            <TableHead>密码</TableHead>
                            <TableHead class名称="w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {app.appBasicAuths.map(basicAuth => (
                            <TableRow key={basicAuth.id}>
                                <TableCell class名称="font-medium">{basicAuth.username}</TableCell>
                                <TableCell class名称="font-medium">
                                    <TooltipProvider>
                                        <Tooltip delayDuration={300}>
                                            <TooltipTrigger>
                                                <Button variant="ghost">
                                                    <Eye />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{basicAuth.password}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                {!readonly && <TableCell class名称="font-medium flex gap-2">
                                    <BasicAuth编辑Dialog app={app} basicAuth={basicAuth}>
                                        <Button variant="ghost"><编辑Icon /></Button>
                                    </BasicAuth编辑Dialog>
                                    <Button variant="ghost" onClick={() => async删除(basicAuth.id)}>
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
                    <Button>添加 Auth Credential</Button>
                </FileMount编辑Dialog>
            </CardFooter>}
        </Card >
    </>;
}