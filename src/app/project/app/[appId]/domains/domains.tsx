'use client';

import { Card, CardContent, Card描述, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckIcon, 编辑Icon, Plus, TrashIcon, XIcon } from "lucide-react";
import Dialog编辑Dialog from "./domain-edit-overlay";
import { Toast } from "@/frontend/utils/toast.utils";
import { deleteDomain } from "./actions";
import { Code } from "@/components/custom/code";
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { use确认Dialog } from "@/frontend/states/zustand.states";


export default function DomainsList({ app, readonly }: {
    app: AppExtendedModel;
    readonly: boolean;
}) {

    const { open确认Dialog: openDialog } = use确认Dialog();

    const async删除Domain = async (domainId: string) => {
        const confirm = await openDialog({
            title: "删除 Domain",
            description: "The domain will be removed and the changes will take effect, after you deploy the app. Are you sure you want to remove this domain?",
            okButton: "删除 Domain"
        });
        if (confirm) {
            await Toast.fromAction(() => deleteDomain(domainId));
        }
    };

    return <>
        <Card>
            <CardHeader>
                <CardTitle>Domains</CardTitle>
                <Card描述>添加 custom domains to your application. If your app has a domain configured, it will be public and accessible via the internet.
                </Card描述>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableCaption>{app.appDomains.length} Domains</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>名称</TableHead>
                            <TableHead>Port</TableHead>
                            <TableHead>SSL</TableHead>
                            <TableHead>Redirect HTTP to HTTPS</TableHead>
                            <TableHead class名称="w-[100px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {app.appDomains.map(domain => (
                            <TableRow key={domain.hostname}>
                                <TableCell class名称="font-medium flex gap-2">
                                    <Code>{domain.hostname}</Code>
                                    <div class名称="self-center cursor-pointer" onClick={() => window.open((domain.useSsl ? 'https://' : 'http://') + domain.hostname, '_blank')}>
                                        <OpenInNewWindowIcon />
                                    </div>
                                </TableCell>
                                <TableCell class名称="font-medium">{domain.port}</TableCell>
                                <TableCell class名称="font-medium">{domain.useSsl ? <CheckIcon /> : <XIcon />}</TableCell>
                                <TableCell class名称="font-medium">{domain.useSsl && domain.redirectHttps ? <CheckIcon /> : <XIcon />}</TableCell>
                                {!readonly && <TableCell class名称="font-medium flex gap-2">
                                    <Dialog编辑Dialog appId={app.id} domain={domain}>
                                        <Button variant="ghost"><编辑Icon /></Button>
                                    </Dialog编辑Dialog>
                                    <Button variant="ghost" onClick={() => async删除Domain(domain.id)}>
                                        <TrashIcon />
                                    </Button>
                                </TableCell>}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            {!readonly && <CardFooter>
                <Dialog编辑Dialog appId={app.id}>
                    <Button><Plus /> 添加 Domain</Button>
                </Dialog编辑Dialog>
            </CardFooter>}
        </Card >

    </>;
}