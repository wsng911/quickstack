import { V1Job, V1ResourceRequirements } from "@kubernetes/client-node";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { AppBuildMethod } from "@/shared/model/app-source-info.model";

export type BuildJobBuilderContext = {
    app: AppExtendedModel;
    build名称: string;
    deploymentId: string;
    latestRemoteGitHash: string;
    latestRemoteGitCommitMessage: string;
    queuedAt: string;
    nodeSelector?: Record<string, string>;
    resources?: V1ResourceRequirements;
    gitSshPrivateKeySecret名称?: string;
};

export interface BuildJobBuilder {
    readonly buildMethod: AppBuildMethod;
    buildJobDefinition(ctx: BuildJobBuilderContext): Promise<V1Job>;
}
