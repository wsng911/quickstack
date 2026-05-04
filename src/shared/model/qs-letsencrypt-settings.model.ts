import { stringToBoolean } from "@/shared/utils/zod.utils";
import { z } from "zod";

export const qsLetsEncrypt设置ZodModel = z.object({
  letsEncryptMail: z.string().trim().email(),
})

export type QsLetsEncrypt设置Model = z.infer<typeof qsLetsEncrypt设置ZodModel>;