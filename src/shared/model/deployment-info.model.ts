import { z } from "zod";
import { appBuildMethodZodModel } from "./app-source-info.model";

export const deployment状态EnumZod = z.union([
    z.literal('UNKNOWN'),
    z.literal('BUILDING'),
    z.literal('ERROR'),
    z.literal('DEPLOYED'),
    z.literal('DEPLOYING'),
    z.literal('SHUTDOWN'),
    z.literal('SHUTTING_DOWN'),
    z.literal('PENDING'),
]);

export const deploymentInfoZodModel = z.object({
    replicaset名称: z.string().optional(),
    buildJob名称: z.string().optional(),
    createdAt: z.date(),
    status: deployment状态EnumZod,
    gitCommit: z.string().optional(),
    gitCommitMessage: z.string().optional(),
    deploymentId: z.string(),
    buildMethod: appBuildMethodZodModel.optional(),
});

export type DeploymentInfoModel = z.infer<typeof deploymentInfoZodModel>;
export type Deployment状态 = z.infer<typeof deployment状态EnumZod>;

