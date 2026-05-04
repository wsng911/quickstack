'use client';

import { Button } from "@/components/ui/button";
import { 编辑Icon, Plus, TrashIcon } from "lucide-react";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import React from "react";
import { SimpleDataTable } from "@/components/custom/simple-data-table";
import { formatDateTime } from "@/frontend/utils/format.utils";
import { deleteRole } from "./actions";
import { adminRole名称 } from "@/shared/model/role-extended.model.ts";
import Role编辑Overlay from "./user-group-edit-overlay";
import { ProjectExtendedModel } from "@/shared/model/project-extended.model";
import { UserGroupExtended } from "@/shared/model/sim-session.model";

export default function UserGroupsTable({ userGroups, projects }: {
    userGroups: UserGroupExtended[];
    projects: ProjectExtendedModel[];
}) {

    const { open确认Dialog: openDialog } = use确认Dialog();

    const async删除Item = async (id: string) => {
        const confirm = await openDialog({
            title: "删除 Group",
            description: "Do you really want to delete this group? Users with this group will be assigned to no role afterwards. They will not be able to use QuickStack until you reassign a new group to them.",
            okButton: "删除",
        });
        if (confirm) {
            await Toast.fromAction(() => deleteRole(id), 'Deleting Group...', 'Group deleted successfully');
        }
    };

    return <>
        <SimpleDataTable columns={[
            ['id', 'ID', false],
            ['name', '名称', true],
            ["createdAt", "创建d At", true, (item) => formatDateTime((item as any).createdAt)],
            ["updatedAt", "Updated At", false, (item) => formatDateTime((item as any).updatedAt)],
        ]}
            data={userGroups}
            actionCol={(item) =>
                <>
                    <div class名称="flex">
                        {item.name !== adminRole名称 && <>
                            <div class名称="flex-1"></div>
                            <Role编辑Overlay projects={projects} userGroup={item} >
                                <Button variant="ghost"><编辑Icon /></Button>
                            </Role编辑Overlay>
                            <Button variant="ghost" onClick={() => async删除Item(item.id)}>
                                <TrashIcon />
                            </Button>
                        </>}
                    </div>
                </>}
        />
        <Role编辑Overlay projects={projects} >
            <Button variant="secondary"><Plus /> 创建 Group</Button>
        </Role编辑Overlay>
    </>;
}