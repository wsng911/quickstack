'use client';

import { Button } from "@/components/ui/button";
import { ArrowDown, ChevronDown, 编辑Icon, Plus, Trash2, TrashIcon, UserPlus } from "lucide-react";
import { Toast } from "@/frontend/utils/toast.utils";
import { use确认Dialog } from "@/frontend/states/zustand.states";
import React from "react";
import { SimpleDataTable } from "@/components/custom/simple-data-table";
import { formatDateTime } from "@/frontend/utils/format.utils";
import { UserExtended } from "@/shared/model/user-extended.model";
import User编辑Overlay from "./user-edit-overlay";
import { deleteUser } from "./actions";
import { UserGroupExtended, UserSession } from "@/shared/model/sim-session.model";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import UsersBulkRoleAssignment from "./users-table-bulk-role-assignment";
import { 操作 } from "@/frontend/utils/nextjs-actions.utils";

export default function UsersTable({ users, userGroups, session }: {
    users: UserExtended[];
    userGroups: UserGroupExtended[];
    session: UserSession;
}) {

    const { open确认Dialog: openDialog } = use确认Dialog();
    const [selectedUsers, setSelectedUsers] = React.useState<UserExtended[]>([]);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = React.useState(false);

    const async删除Item = async (id: string) => {
        const confirm = await openDialog({
            title: "删除 User",
            description: "Do you really want to delete this user?",
            okButton: "删除",
        });
        if (confirm) {
            await Toast.fromAction(() => deleteUser(id), 'Deleting User...', 'User deleted successfully');
        }
    };

    const handleBulk删除 = async () => {
        // Filter out admin users from selected users
        const deletableUsers = selectedUsers.filter(user => session.email !== user.email);

        if (deletableUsers.length === 0) {
            toast.error("No deletable users selected (admins cannot be deleted)");
            return;
        }

        const confirm = await openDialog({
            title: "删除 Selected Users",
            description: `Do you really want to delete ${deletableUsers.length} user(s)?`,
            okButton: "删除",
        });

        if (confirm) {
            try {
                // 删除 users one by one
                for (const user of deletableUsers) {
                    await 操作.run(() => deleteUser(user.id));
                }
                toast.success(`Successfully deleted ${deletableUsers.length} user(s)`);
            } catch (error) {
                toast.error("Error deleting users");
                console.error(error);
            }
        }
    };

    return <>
        <SimpleDataTable columns={[
            ['id', 'ID', false],
            ['email', 'Mail', true],
            ['userGroup.name', 'Group', true],
            ["createdAt", "创建d At", true, (item) => formatDateTime(item.createdAt)],
            ["updatedAt", "Updated At", false, (item) => formatDateTime(item.updatedAt)],
        ]}
            data={users}
            showSelectCheckbox={true}
            onRowSelectionUpdate={setSelectedUsers}
            columnFilters={userGroups.map((userGroup) => ({
                accessorKey: 'role.name',
                filterLabel: userGroup.name,
                filterFunction: (item: UserExtended) => item.userGroupId === userGroup.id,
            }))}
            actionCol={(item) =>
                <>
                    <div class名称="flex">
                        <div class名称="flex-1"></div>
                        {session.email !== item.email && <><User编辑Overlay user={item} userGroups={userGroups}>
                            <Button variant="ghost"><编辑Icon /></Button>
                        </User编辑Overlay>
                            <Button variant="ghost" onClick={() => async删除Item(item.id)}>
                                <TrashIcon />
                            </Button>
                        </>}
                    </div>
                </>}
        />
        <div class名称="flex gap-4">
            <User编辑Overlay userGroups={userGroups}>
                <Button variant="secondary"><Plus /> 创建 User</Button>
            </User编辑Overlay>
            {selectedUsers.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline"> 操作 <ChevronDown /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setIsRoleDialogOpen(true)}>
                            <UserPlus />   Assign Group
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleBulk删除}>
                            <Trash2 /> 删除 Selected
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>

        <UsersBulkRoleAssignment
            isOpen={isRoleDialogOpen}
            onOpenChange={setIsRoleDialogOpen}
            selectedUsers={selectedUsers}
            userGroups={userGroups}
        />
    </>;
}