import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

export function ReadonlyInfo({ icon: Icon, label, value, action }: {
    icon?: LucideIcon;
    label: string;
    value: string;
    action?: ReactNode;
}) {
    return (
        <div class名称="flex min-w-0 items-center justify-between gap-3 rounded-md border p-3">
            <div class名称="flex min-w-0 items-center gap-3">
                {Icon && <Icon class名称="h-4 w-4 shrink-0 text-muted-foreground" />}
                <div class名称="min-w-0">
                    <p class名称="text-xs text-muted-foreground">{label}</p>
                    <p class名称="truncate text-sm font-medium">{value}</p>
                </div>
            </div>
            {action && <div class名称="shrink-0">{action}</div>}
        </div>
    );
}
