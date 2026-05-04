import { Alert, Alert描述, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/frontend/utils/utils";
import { Eye, EyeOff, Loader2, RefreshCw, type LucideIcon } from "lucide-react";
import { type ComponentProps } from "react";

export function IconInput({ icon: Icon, label, class名称, ...props }: ComponentProps<typeof Input> & { icon: LucideIcon; label: string }) {
    return (
        <div class名称="space-y-2">
            <Label>{label}</Label>
            <div class名称="relative">
                <Icon class名称="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input class名称={cn("pl-9", class名称)} {...props} />
            </div>
        </div>
    );
}

export function SecretInput({ icon: Icon, label, value, visible, onVisibleChange, onChange }: {
    icon: LucideIcon;
    label: string;
    value: string;
    visible: boolean;
    onVisibleChange: (visible: boolean) => void;
    onChange: (value: string) => void;
}) {
    const EyeIcon = visible ? EyeOff : Eye;
    return (
        <div class名称="space-y-2">
            <Label>{label}</Label>
            <div class名称="relative">
                <Icon class名称="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    class名称="pl-9 pr-10"
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    class名称="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={() => onVisibleChange(!visible)}
                >
                    <EyeIcon class名称="h-4 w-4" />
                    <span class名称="sr-only">{visible ? 'Hide secret' : 'Show secret'}</span>
                </Button>
            </div>
        </div>
    );
}

export function BranchLoadingState({ loading, error, onRetry }: {
    loading: boolean;
    error: string | null;
    onRetry: () => Promise<boolean>;
}) {
    if (loading) {
        return (
            <div class名称="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                <Loader2 class名称="h-4 w-4 animate-spin" />
                Loading branches...
            </div>
        );
    }

    if (!error) {
        return null;
    }

    return (
        <Alert variant="destructive">
            <AlertTitle>Branches could not be loaded</AlertTitle>
            <Alert描述 class名称="space-y-3">
                <p>{error}</p>
                <Button type="button" variant="outline" onClick={onRetry}>
                    <RefreshCw class名称="h-4 w-4" />
                    Retry
                </Button>
            </Alert描述>
        </Alert>
    );
}

export function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div class名称="grid gap-1 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
            <p class名称="text-sm text-muted-foreground">{label}</p>
            <p class名称={cn("truncate text-sm font-medium", mono && "font-mono")}>{value || 'Not configured'}</p>
        </div>
    );
}

export function SecretSummaryRow({ label, value, visible, onVisibleChange }: {
    label: string;
    value: string;
    visible: boolean;
    onVisibleChange: (visible: boolean) => void;
}) {
    const EyeIcon = visible ? EyeOff : Eye;
    const displayValue = value ? (visible ? value : '************') : 'Not configured';
    return (
        <div class名称="grid gap-1 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
            <p class名称="text-sm text-muted-foreground">{label}</p>
            <div class名称="flex min-w-0 items-center gap-2">
                <p class名称="truncate font-mono text-sm font-medium">{displayValue}</p>
                {!!value && (
                    <Button type="button" variant="ghost" size="icon" class名称="h-7 w-7 shrink-0" onClick={() => onVisibleChange(!visible)}>
                        <EyeIcon class名称="h-4 w-4" />
                        <span class名称="sr-only">{visible ? 'Hide secret' : 'Show secret'}</span>
                    </Button>
                )}
            </div>
        </div>
    );
}
