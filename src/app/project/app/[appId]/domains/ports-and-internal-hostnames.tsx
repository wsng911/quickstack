'use client';

import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { deletePort, savePort } from "./actions";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { KubeObject名称Utils } from "@/server/utils/kube-object-name.utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Code } from "@/components/custom/code";
import { ListUtils } from "@/shared/utils/list.utils";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DefaultPort编辑Dialog from "./default-port-edit";
import { Button } from "@/components/ui/button";
import { 编辑Icon, Plus, TrashIcon } from "lucide-react";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";

export default function InternalHostnames({ app, readonly }: {
    app: AppExtendedModel;
    readonly: boolean;
}) {

    const { open确认Dialog: openDialog } = use确认Dialog();

    const async删除Domain = async (portId: string) => {
        const confirm = await openDialog({
            title: "删除 Port",
            description: "The port will be removed and the changes will take effect, after you deploy the app. Are you sure you want to remove this port?",
            okButton: "删除 Port"
        });
        if (confirm) {
            await Toast.fromAction(() => deletePort(portId));
        }
    };

    const internalUrl = KubeObject名称Utils.toService名称(app.id);

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Internal Ports</CardTitle>
                <Card描述>If you want to connect other apps to this app, you have to configure the internal ports below.</Card描述>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>{app.appPorts.length} Ports</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Port</TableHead>
                            <TableHead class名称="w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {app.appPorts.map(port => (
                            <TableRow key={port.id}>
                                <TableCell class名称="font-medium">
                                    {port.port}
                                </TableCell>
                                {!readonly && <TableCell class名称="font-medium  flex gap-2">
                                    <DefaultPort编辑Dialog appId={app.id} appPort={port}>
                                        <Button variant="ghost"><编辑Icon /></Button>
                                    </DefaultPort编辑Dialog>
                                    <Button variant="ghost" onClick={() => async删除Domain(port.id)}>
                                        <TrashIcon />
                                    </Button>
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            {!readonly && <CardFooter>
                <DefaultPort编辑Dialog appId={app.id}>
                    <Button><Plus /> 添加 Port</Button>
                </DefaultPort编辑Dialog>
            </CardFooter>}
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Internal Hostnames</CardTitle>
                <Card描述>Internal hostnames can be used to connect to this app from other apps in the same project. </Card描述>
            </CardHeader>
            <CardContent>
                {ListUtils.removeDuplicates([
                    ...app.appPorts.map(p => p.port),
                    ...app.appDomains.map(d => d.port)
                ]).map(port => (
                    <div key={port} class名称="flex gap-1 pb-2">
                        <div><Code>{internalUrl + ':' + port}</Code></div>
                        <div class名称="self-center">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild><QuestionMarkCircledIcon /></TooltipTrigger>
                                    <TooltipContent>
                                        <p class名称="max-w-[350px]">
                                            Other apps can connect to this app using this hostname. This hostname is valid for all internal connections within the same project.<br /><br />
                                            <span class名称="font-bold">Hostname:</span> {internalUrl}<br />
                                            <span class名称="font-bold">Port:</span> {port}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card >
    </>;
}