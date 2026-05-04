import { z } from "zod";

export const podsInfoZodModel = z.object({
    pod名称: z.string(),
    container名称: z.string(),
    uid: z.string().optional(),
    status: z.string().optional(),
});

export type PodsInfoModel = z.infer<typeof podsInfoZodModel>;


