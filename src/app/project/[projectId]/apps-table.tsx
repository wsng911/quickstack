'use client'

import { Button } from "@/components/ui/button";

import Link from "next/link";
import { SimpleDataTable } from "@/components/custom/simple-data-table";
import { formatDateTime } from "@/frontend/utils/format.utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 编辑2, Eye, MoreHorizontal, Trash } from "lucide-react";
import { Toast } from "@/frontend/utils/toast.utils";
import { App, Project } from "@prisma/client";
import { deleteApp } from "./actions";
import { useBreadcrumbs, use确认Dialog } from "@/frontend/states/zustand.states";
import { useEffect } from "react";
import { 编辑AppDialog } from "./edit-app-dialog";
import { UserSession } from "@/shared/model/sim-session.model";
import { UserGroupUtils } from "@/shared/utils/role.utils";
import Pod状态Indicator from "@/components/custom/pod-status-indicator";


export default function AppTable({
    app,
    projectId,
    session
}: {
    app: App[],
    projectId: string,
    session: UserSession
}) {

    const { open确认Dialog: openDialog } = use确认Dialog();

    return <>
        <SimpleDataTable columns={[
            ['id', 'ID', false],
            ['name', '名称', true],
            ['sourceType', 'Source Type', false, (item) => item.sourceType === 'GIT' ? 'Git HTTPS' : item.sourceType === 'GIT_SSH' ? 'Git SSH' : 'Container'],
            ['replicas', 'Replica Count', false],
            ['memoryLimit', 'Memory Limit', false],
            ['memoryReservation', 'Memory Reservation', false],
            ['cpuLimit', 'CPU Limit', false],
            ['cpuReservation', 'CPU Reservation', false],
            ["createdAt", "创建d At", true, (item) => formatDateTime(item.createdAt)],
            ["updatedAt", "Updated At", false, (item) => formatDateTime(item.updatedAt)],
            ['status', '状态', true, (item) => <Pod状态Indicator appId={item.id} />],
        ]}
            data={app}
            onItemClickLink={(item) => `/project/app/${item.id}`}
            actionCol={(item) =>
                <>
                    <div class名称="flex">
                        <div class名称="flex-1"></div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" class名称="h-8 w-8 p-0">
                                    <span class名称="sr-only">Open menu</span>
                                    <MoreHorizontal class名称="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>操作</DropdownMenuLabel>
                                <Link href={`/project/app/${item.id}`}>
                                    <DropdownMenuItem>
                                        <Eye /> <span>Show App Details</span>
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                {UserGroupUtils.sessionCan创建NewAppsForProject(session, projectId) &&
                                    <编辑AppDialog projectId={projectId} existingItem={item}>
                                        <DropdownMenuItem>
                                            <编辑2 /> <span>编辑 App 名称</span>
                                        </DropdownMenuItem>
                                    </编辑AppDialog>}
                                {UserGroupUtils.sessionCan删除AppsForProject(session, projectId) && <DropdownMenuItem class名称="text-red-500"
                                    onClick={() => openDialog({
                                        title: "删除 App",
                                        description: "Are you sure you want to delete this app? All data will be lost and this action cannot be undone.",
                                    }).then((result) => result ? Toast.fromAction(() => deleteApp(item.id)) : undefined)}>
                                    <Trash />  <span >删除 App</span>
                                </DropdownMenuItem>}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </>}
        />
    </>
}
