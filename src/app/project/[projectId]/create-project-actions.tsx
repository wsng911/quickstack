'use client'

import { Button } from "@/components/ui/button";

import { 编辑AppDialog } from "./edit-app-dialog";
import { Blocks, Database, File, LayoutGrid, Plus } from "lucide-react";
import ChooseTemplateDialog from "./choose-template-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react";


export default function 创建Project操作({
    projectId,
}: {
    projectId: string;
}) {

    const [templateType, setTemplateType] = useState<"database" | "template" | undefined>(undefined);

    return (
        <>
            <ChooseTemplateDialog projectId={projectId} templateType={templateType} on关闭={() => setTemplateType(undefined)} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button><Plus /> 创建 App</Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                    <编辑AppDialog projectId={projectId}>
                        <DropdownMenuItem><File /> Empty App</DropdownMenuItem>
                    </编辑AppDialog>
                    <DropdownMenuItem onClick={() => setTemplateType('database')}><Database /> Database</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTemplateType('template')}><Blocks /> Template</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
