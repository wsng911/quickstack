import {
  Dialog,
  DialogContent,
  Dialog描述,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import React, { useEffect } from "react";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { getLatestAppEvents } from "./actions";
import { toast } from "sonner";
import FullLoadingSpinner from "@/components/ui/full-loading-spinnter";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EventInfoModel } from "@/shared/model/event-info.model";
import { formatDateTime } from "@/frontend/utils/format.utils";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { cn } from "@/frontend/utils/utils";

export function AppEventsDialog({
  app,
  children
}: {
  app: AppExtendedModel;
  children: React.ReactNode;
}) {

  const [isOpen, setIsOpen] = React.useState(false);
  const [events, setEvents] = React.useState<EventInfoModel[] | undefined>(undefined);

  const loadEvents = async () => {
    try {
      const eventsResponse = await getLatestAppEvents(app.id);
      if (eventsResponse.status === 'success') {
        setEvents(eventsResponse.data!);
      } else {
        toast.error(eventsResponse.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occured while loading events.');
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    } else {
      setEvents(undefined);
    }
  }, [isOpen]);

  return (<>
    <div onClick={() => setIsOpen(true)} class名称="cursor-pointer"> {children}</div>
    <Dialog open={isOpen} onOpenChange={(isO) => {
      setIsOpen(isO);
    }}>
      <DialogContent class名称="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>App Events</DialogTitle>
          <Dialog描述>
            App events occur when changes are made to the deployment. For example, when a deployment is created, updated, or restarted.
            Advanced users can read these events to understand what is happening in the background. Events are only available for a short period of time.
          </Dialog描述>
        </DialogHeader>
        <div class名称="space-y-4">
          {!events && <FullLoadingSpinner />}
          {events && <>
            <Table>
              <ScrollArea class名称="max-h-[70vh]">
                <TableCaption>{events.length} recent Events</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Pod 名称</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={(event.eventTime + '') || index}>
                      <TableCell>{formatDateTime(event.eventTime, true)}</TableCell>
                      <TableCell >{event.action}</TableCell>
                      <TableCell class名称={cn("font-medium", event.type !== 'Normal' ? 'text-orange-500' : '')}>
                        {event.reason}
                      </TableCell>
                      <TableCell >{event.note}</TableCell>
                      <TableCell >{event.pod名称}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ScrollArea>
            </Table>
          </>}
        </div>
      </DialogContent>
    </Dialog>
  </>)
}
