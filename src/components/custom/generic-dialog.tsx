'use client'

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { DialogContext } from "@/frontend/states/dialog-context";
import { useDialog } from "@/frontend/states/zustand.states";
import { cn } from "@/frontend/utils/utils";
import React from "react";

export function GenericDialog() {
  const { isDialogOpen, content, width, height, closeDialog } = useDialog();

  if (!content) {
    return <></>;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={() => closeDialog()}>
      <DialogContent className={cn(
        width ? `max-w-[${width}]` : 'max-w-[555px]',
        height ? height : 'h-auto',
      )} style={{
        width: width ? width : undefined,
        height: height ? height : undefined,
      }}>
        <DialogContext.Provider value={{ closeDialog }}>
          {content}
        </DialogContext.Provider>
      </DialogContent>
    </Dialog>
  )
}