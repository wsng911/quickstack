import { z } from "zod";

export const fileMount编辑ZodModel = z.object({
  containerMountPath: z.string().trim().min(1),
  content: z.string().min(1),
})

export type FileMount编辑Model = z.infer<typeof fileMount编辑ZodModel>;