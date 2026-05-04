import { stringToNumber } from "@/shared/utils/zod.utils";
import { z } from "zod";

export const user编辑ZodModel = z.object({
  id: z.string().trim().optional(),
  email: z.string().trim().min(1),
  new密码: z.string().optional(),
  userGroupId: z.string().trim().nullable(),
})

export type User编辑Model = z.infer<typeof user编辑ZodModel>;
