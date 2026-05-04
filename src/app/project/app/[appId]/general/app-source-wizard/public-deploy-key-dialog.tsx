'use client';

import { Button } from "@/components/ui/button";
import { Dialog描述, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useDialogContext } from "@/frontend/states/dialog-context";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";

export function PublicDeployKeyDialog({ publicKey }: { publicKey: string }) {
    const { closeDialog } = useDialogContext();

    const copyPublicKey = () => {
        navigator.clipboard.writeText(publicKey);
        toast.success('Copied to clipboard.');
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Public Deploy Key</DialogTitle>
                <Dialog描述>添加 this public key as a deploy key in your Git provider.</Dialog描述>
            </DialogHeader>
            <Textarea readOnly value={publicKey} class名称="min-h-32 font-mono text-xs" />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={copyPublicKey}>
                    <ClipboardCopy class名称="h-4 w-4" />
                    Copy
                </Button>
                <Button type="button" onClick={() => closeDialog(true)}>关闭</Button>
            </DialogFooter>
        </>
    );
}
