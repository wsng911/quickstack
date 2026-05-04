import { stringToBoolean } from "@/shared/utils/zod.utils";
import { z } from "zod";

export const qsIngress设置ZodModel = z.object({
  serverUrl: z.string().trim().min(1),
  disableNodePortAccess: stringToBoolean,
})

export type QsIngress设置Model = z.infer<typeof qsIngress设置ZodModel>;