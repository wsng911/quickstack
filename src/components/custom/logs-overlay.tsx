import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import React from "react";

import LogsStreamed from "@/components/custom/logs-streamed";

export function LogsDialog({
  namespace,
  pod名称,
  on关闭,
  children
}: {
  namespace: string;
  pod名称: string;
  on关闭?: () => void;
  children: React.ReactNode;
}) {

  const [linesCountInput, setLinesCountInput] = React.useState<number>(100);
  const [linesCount, setLinesCount] = React.useState<number>(100);
  const [isOpen, setIsOpen] = React.useState(false);

  return (<>
    <div onClick={() => setIsOpen(true)}>
      {children}
    </div>
    <Dialog open={isOpen} onOpenChange={(isO) => {
      setIsOpen(isO);
      if (on关闭 && !isO) {
        on关闭();
      }
    }}>
      <DialogContent class名称="sm:max-w-[1300px]">
        <DialogHeader>
          <DialogTitle>Logs</DialogTitle>
        </DialogHeader>
        <div class名称="space-y-4">
          <Input placeholder="Lines showed (default 100)" value={linesCountInput} onChange={(e) => setLinesCountInput(parseInt(e.target.value || '0'))}
            onBlur={(e) => {
              const value = parseInt(e.target.value || '0');
              if (value > 0) {
                setLinesCount(value);
              }
            }} />
          {(namespace && pod名称) ? <LogsStreamed namespace={namespace} pod名称={pod名称} linesCount={linesCount} fullHeight={true} /> : 'Currently there are no Logs available'}
        </div>
      </DialogContent>
    </Dialog>
  </>
  )
}
