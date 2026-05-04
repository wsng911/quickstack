import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  Dialog描述,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React, { useEffect } from "react";
import { TerminalSetupInfoModel } from "@/shared/model/terminal-setup-info.model";
import TerminalStreamed from "./terminal-streamed";

export function TerminalDialog({
  terminalInfo,
  children
}: {
  terminalInfo: TerminalSetupInfoModel;
  children: React.ReactNode;
}) {

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(isO) => {
      setIsOpen(isO);
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent class名称="sm:max-w-[1300px]">
        <DialogHeader>
          <DialogTitle>Terminal</DialogTitle>
        </DialogHeader>
        <div class名称="space-y-4">
          {terminalInfo ? <TerminalStreamed terminalInfo={terminalInfo} /> : 'Currently there is no Terminal available'}
        </div>
      </DialogContent>
    </Dialog>
  )
}
