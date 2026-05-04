'use client'

import { InputDialog } from "@/components/custom/input-dialog"
import { Button } from "@/components/ui/button"
import { Toast } from "@/frontend/utils/toast.utils";
import { createProject } from "./actions";
import { useInputDialog } from "@/frontend/states/zustand.states";
import { Project } from "@prisma/client";


export function 编辑ProjectDialog({ children, existingItem }: { children?: React.ReactNode, existingItem?: Project }) {

    const { openInputDialog } = useInputDialog();
    const createProj = async () => {
        const name = await openInputDialog({
            title: "创建 Project",
            description: "名称 your new project.",
            field名称: "名称",
            okButton: "创建 Project",
            inputValue: existingItem?.name ?? ''
        })
        if (!name) { return; }
        await Toast.fromAction(() => createProject(name, existingItem?.id));
    };

    return <div onClick={() => createProj()}>{children}</div>
}