import { FileCode2, Loader2 } from "lucide-react";
import { IconInput } from "./source-wizard-fields";
import { defaultDockerfilePath } from "./types";

export function DockerfilePathStep({ value, isDetecting, onChange }: {
    value: string;
    isDetecting: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <div class名称="space-y-4">
            {isDetecting && (
                <div class名称="flex min-h-20 items-center justify-center gap-2 rounded-md border text-sm text-muted-foreground">
                    <Loader2 class名称="h-4 w-4 animate-spin" />
                    Detecting Dockerfile...
                </div>
            )}
            <IconInput
                icon={FileCode2}
                label="Dockerfile Path"
                placeholder={defaultDockerfilePath}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}
