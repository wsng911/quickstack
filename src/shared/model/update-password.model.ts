import { z } from "zod";

export const profile密码ChangeZodModel = z.object({
  old密码: z.string().trim().min(1),
  new密码: z.string().trim().min(6),
  confirmNew密码: z.string().trim().min(6)
})

export type Profile密码ChangeModel = z.infer<typeof profile密码ChangeZodModel>;