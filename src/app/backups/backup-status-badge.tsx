'use client'

import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";

interface 返回up状态BadgeProps {
    missed返回up: boolean | undefined;
}

export default function 返回up状态Badge({ missed返回up }: 返回up状态BadgeProps) {
    if (missed返回up === undefined) {
        return null;
    }

    if (missed返回up) {
        return (
            <Tooltip>
                <TooltipTrigger>
                    <span class名称="px-2 py-1 rounded-lg text-sm font-semibold bg-orange-100 text-orange-800">
                        Warning
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p class名称="max-w-60">The backup schedule is configured, but it seems that a backup has not been created recently. This could indicate a problem with the backup process. Please check the backup configuration and logs to ensure that backups are running correctly.</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <span class名称="px-2 py-1 rounded-lg text-sm font-semibold bg-green-100 text-green-800">
            OK
        </span>
    );
}
