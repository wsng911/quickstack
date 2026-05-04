import { AppSourceInfoInputModel } from "@/shared/model/app-source-info.model";
import { Link as LinkIcon, LockKeyhole, User } from "lucide-react";
import { BranchLoadingState, IconInput, SecretInput } from "./source-wizard-fields";
import { SourceFormPatch } from "./types";

export function GitHttpsUrlStep({ formData, showCredentials, showToken, setShowToken, onChange, isLoadingBranches, branchError, onRetry }: {
    formData: AppSourceInfoInputModel;
    showCredentials: boolean;
    showToken: boolean;
    setShowToken: (show: boolean) => void;
    onChange: (patch: SourceFormPatch) => void;
    isLoadingBranches: boolean;
    branchError: string | null;
    onRetry: () => Promise<boolean>;
}) {
    return (
        <div class名称="space-y-4">
            <IconInput
                icon={LinkIcon}
                label="Git URL"
                placeholder="https://github.com/user/repo.git"
                value={formData.gitUrl ?? ''}
                onChange={(event) => onChange({ gitUrl: event.target.value, gitBranch: '' })}
            />
            {showCredentials && (
                <div class名称="grid gap-4 md:grid-cols-2">
                    <IconInput
                        icon={User}
                        label="Git 用户名"
                        value={formData.git用户名 ?? ''}
                        onChange={(event) => onChange({ git用户名: event.target.value })}
                    />
                    <SecretInput
                        icon={LockKeyhole}
                        label="Git 密码 or Token"
                        value={formData.gitToken ?? ''}
                        visible={showToken}
                        onVisibleChange={setShowToken}
                        onChange={(value) => onChange({ gitToken: value })}
                    />
                </div>
            )}
            <BranchLoadingState loading={isLoadingBranches} error={branchError} onRetry={onRetry} />
        </div>
    );
}
