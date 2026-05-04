import { AppBuildMethod, AppSourceInfoInputModel } from "@/shared/model/app-source-info.model";
import { SecretSummaryRow, SummaryRow } from "./source-wizard-fields";
import { buildMethodLabels, defaultDockerfilePath, SourceType, sourceTypeLabels } from "./types";

export function SourceSummaryStep({ formData, publicKey, showGitToken, setShowGitToken, showRegistry密码, setShowRegistry密码 }: {
    formData: AppSourceInfoInputModel;
    publicKey?: string;
    showGitToken: boolean;
    setShowGitToken: (show: boolean) => void;
    showRegistry密码: boolean;
    setShowRegistry密码: (show: boolean) => void;
}) {
    const isGitSource = formData.sourceType === 'GIT' || formData.sourceType === 'GIT_SSH';
    return (
        <div class名称="space-y-4 rounded-md border p-4">
            <SummaryRow label="Source Type" value={sourceTypeLabels[formData.sourceType as SourceType]} />
            {isGitSource && (
                <>
                    <SummaryRow label="Git URL" value={formData.gitUrl ?? ''} mono />
                    <SummaryRow label="Git Branch" value={formData.gitBranch ?? ''} />
                    <SummaryRow label="Build Method" value={buildMethodLabels[(formData.buildMethod as AppBuildMethod | undefined) ?? 'RAILPACK']} />
                    {formData.buildMethod === 'DOCKERFILE' && <SummaryRow label="Dockerfile Path" value={formData.dockerfilePath ?? defaultDockerfilePath} mono />}
                </>
            )}
            {formData.sourceType === 'GIT' && (
                <>
                    <SummaryRow label="Git 用户名" value={formData.git用户名 || 'Not configured'} />
                    <SecretSummaryRow label="Git 密码 or Token" value={formData.gitToken ?? ''} visible={showGitToken} onVisibleChange={setShowGitToken} />
                </>
            )}
            {formData.sourceType === 'GIT_SSH' && (
                <SummaryRow label="Deploy Key" value={publicKey ? 'Deploy key generated' : 'Not generated'} />
            )}
            {formData.sourceType === 'CONTAINER' && (
                <>
                    <SummaryRow label="Image 名称" value={formData.containerImageSource ?? ''} mono />
                    <SummaryRow label="Registry 用户名" value={formData.containerRegistry用户名 || 'Not configured'} />
                    <SecretSummaryRow label="Registry 密码" value={formData.containerRegistry密码 ?? ''} visible={showRegistry密码} onVisibleChange={setShowRegistry密码} />
                </>
            )}
        </div>
    );
}
