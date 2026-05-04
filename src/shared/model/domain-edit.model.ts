import { stringToBoolean, stringToNumber } from "@/shared/utils/zod.utils";
import { z } from "zod";

export const appDomain编辑ZodModel = z.object({
  hostname: z.string().trim().min(1),
  useSsl: stringToBoolean,
  redirectHttps: stringToBoolean,
  port: stringToNumber,
})

export type AppDomain编辑Model = z.infer<typeof appDomain编辑ZodModel>;