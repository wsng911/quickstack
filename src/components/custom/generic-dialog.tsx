'use client'

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { DialogContext } from "@/frontend/states/dialog-context";
import { useDialog } from "@/frontend/states/zustand.states";
import React from "react";

export function GenericDialog() {
  const { isDialogOpen, content, width, height, maxWidth, maxHeight, closeDialog } = useDialog();

  if (!content) {
    return <></>;
  }

  const dialogStyle: React.CSSProperties = {
    width: width || undefined,
    height: height || undefined,
    maxWidth: maxWidth || width || '555px',
    maxHeight: maxHeight || undefined,
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={() => closeDialog()}>
      <DialogContent className="h-auto" style={dialogStyle}>
        <DialogContext.Provider value={{ closeDialog }}>
          {content}
        </DialogContext.Provider>
      </DialogContent>
    </Dialog>
  )
}
