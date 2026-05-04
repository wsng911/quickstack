import { Alert, Alert描述, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppSourceInfoInputModel } from "@/shared/model/app-source-info.model";
import { ClipboardCopy, KeyRound, Link as LinkIcon, RefreshCw } from "lucide-react";
import { BranchLoadingState, IconInput } from "./source-wizard-fields";
import { SourceFormPatch } from "./types";

export function GitSshUrlStep({ formData, publicKey, isEnsuringKey, isLoadingBranches, branchError, onChange, onCopy, onRegenerate, onRetry }: {
    formData: AppSourceInfoInputModel;
    publicKey?: string;
    isEnsuringKey: boolean;
    isLoadingBranches: boolean;
    branchError: string | null;
    onChange: (patch: SourceFormPatch) => void;
    onCopy: () => void;
    onRegenerate: () => void;
    onRetry: () => Promise<boolean>;
}) {
    return (
        <div class名称="space-y-4">
            <Alert>
                <KeyRound class名称="h-4 w-4" />
                <AlertTitle>添加 this deploy key to your Git provider</AlertTitle>
                <Alert描述>Some Git providers require a unique deploy key per repository. Regenerate the key if this key is already used elsewhere.</Alert描述>
            </Alert>
            <IconInput
                icon={LinkIcon}
                label="Git SSH URL"
                placeholder="git@github.com:user/repo.git"
                value={formData.gitUrl ?? ''}
                onChange={(event) => onChange({ gitUrl: event.target.value, gitBranch: '' })}
            />
            {!!formData.gitUrl?.trim() && (
                <div class名称="space-y-2">
                    <div class名称="flex items-center justify-between gap-3">
                        <Label>Public Deploy Key</Label>
                        <div class名称="flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={onCopy} disabled={!publicKey}>
                                <ClipboardCopy class名称="h-4 w-4" />
                                Copy
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={onRegenerate} disabled={!publicKey}>
                                <RefreshCw class名称="h-4 w-4" />
                                Regenerate key
                            </Button>
                        </div>
                    </div>
                    <Textarea
                        readOnly
                        value={isEnsuringKey ? 'Generating deploy key...' : publicKey ?? ''}
                        class名称="min-h-28 font-mono text-xs"
                    />
                    <Label class名称="text-muted-foreground font-normal">Make sure to add the deploy key to your Git repository with read access.</Label>
                </div>
            )}
            <BranchLoadingState loading={isLoadingBranches} error={branchError} onRetry={onRetry} />
        </div>
    );
}
