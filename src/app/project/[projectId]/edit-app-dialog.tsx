'use client'

import { InputDialog } from "@/components/custom/input-dialog"
import { Button } from "@/components/ui/button"
import { Toast } from "@/frontend/utils/toast.utils";
import { createApp } from "./actions";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { App } from "@prisma/client";
import { useInputDialog } from "@/frontend/states/zustand.states";

export function 编辑AppDialog({
    children,
    projectId,
    existingItem
}: {
    children?: React.ReactNode,
    projectId: string;
    existingItem?: App;
}) {

    const router = useRouter();
    const { openInputDialog } = useInputDialog();

    const createAppFunc = async () => {
        const name = await openInputDialog({
            title: "创建 App",
            description: "名称 your new App.",
            field名称: "名称",
            inputValue: existingItem?.name ?? ''
        })
        if (!name) { return; }
        const result = await Toast.fromAction(() => createApp(name, projectId, existingItem?.id));
        if (result.status === "success" && !existingItem) {
            router.push(existingItem ? `/project/app/${result!.data!.id}` : `/project/app/${result!.data!.id}?tab名称=general`);
        }
    };

    return <div onClick={() => createAppFunc()}>{children}</div>
}