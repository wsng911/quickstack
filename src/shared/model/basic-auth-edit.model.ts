import { stringToNumber } from "@/shared/utils/zod.utils";
import { z } from "zod";

export const basicAuth编辑ZodModel = z.object({
  id: z.string().nullish(),
  username: z.string().trim().min(1),
  password: z.string().trim().min(1),
  appId: z.string().min(1),
});

export type BasicAuth编辑Model = z.infer<typeof basicAuth编辑ZodModel>;