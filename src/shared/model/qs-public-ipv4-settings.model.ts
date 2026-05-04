import { z } from "zod";

export const qsPublicIpv4设置ZodModel = z.object({
  publicIpv4: z.string().trim(),
})

export type QsPublicIpv4设置Model = z.infer<typeof qsPublicIpv4设置ZodModel>;