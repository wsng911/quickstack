'use client';

import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteNodePort } from "./actions";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import NodePort编辑Dialog from "./node-port-edit-dialog";
import { Button } from "@/components/ui/button";
import { 编辑Icon, Plus, TrashIcon } from "lucide-react";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";

export default function NodePortsCard({ app, readonly }: {
    app: AppExtendedModel;
    readonly: boolean;
}) {
    const { open确认Dialog: openDialog } = use确认Dialog();

    const async删除NodePort = async (nodePortId: string) => {
        const confirm = await openDialog({
            title: '删除 Node Port',
            description: 'The node port will be removed and the changes will take effect after you redeploy the app. Are you sure you want to remove this node port?',
            okButton: '删除 Node Port',
        });
        if (confirm) {
            await Toast.fromAction(() => deleteNodePort(nodePortId));
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Node Ports</CardTitle>
                <Card描述>
                    Expose this app directly on a node/host port, bypassing Traefik. Useful for non-HTTP workloads such as SFTP, game servers, or other TCP/UDP services.
                </Card描述>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>{app.appNodePorts.length} Node Port{app.appNodePorts.length !== 1 ? 's' : ''}</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Container Port</TableHead>
                            <TableHead>Node Port</TableHead>
                            <TableHead>Protocol</TableHead>
                            {!readonly && <TableHead class名称="w-[100px]">操作</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {app.appNodePorts.map((np) => (
                            <TableRow key={np.id}>
                                <TableCell class名称="font-medium">{np.port}</TableCell>
                                <TableCell class名称="font-medium">{np.nodePort}</TableCell>
                                <TableCell class名称="font-medium">{np.protocol}</TableCell>
                                {!readonly && (
                                    <TableCell class名称="font-medium flex gap-2">
                                        <NodePort编辑Dialog appId={app.id} appNodePort={np}>
                                            <Button variant="ghost"><编辑Icon /></Button>
                                        </NodePort编辑Dialog>
                                        <Button variant="ghost" onClick={() => async删除NodePort(np.id)}>
                                            <TrashIcon />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            {!readonly && (
                <CardFooter>
                    <NodePort编辑Dialog appId={app.id}>
                        <Button><Plus /> 添加 Node Port</Button>
                    </NodePort编辑Dialog>
                </CardFooter>
            )}
        </Card>
    );
}
