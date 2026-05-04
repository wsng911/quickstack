import { z } from "zod";
import { buildJobSchemaZod } from "./build-job";

export const globalBuildJobSchemaZod = buildJobSchemaZod.extend({
    appId: z.string(),
    projectId: z.string(),
    app名称: z.string(),
    project名称: z.string(),
    completionTime: z.date().optional(),
});

export type GlobalBuildJobModel = z.infer<typeof globalBuildJobSchemaZod>;
