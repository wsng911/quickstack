'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  Dialog描述,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import React from "react";
import { use确认Dialog } from "@/frontend/states/zustand.states";

export function 确认Dialog() {
  const { isDialogOpen, data, closeDialog } = use确认Dialog();
  if (!data) {
    return <></>;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
      <DialogContent class名称="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
          <Dialog描述>
            {data.description}
          </Dialog描述>
        </DialogHeader>
        <DialogFooter>
          {data.okButton !== '' && <Button onClick={() => closeDialog(true)}>{data.okButton ?? 'OK'}</Button>}
          <Button variant="secondary" onClick={() => closeDialog(false)}>{data.cancelButton ?? '取消'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
