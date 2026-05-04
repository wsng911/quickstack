import { stringToNumber } from "@/shared/utils/zod.utils";
import { z } from "zod";

export const s3Target编辑ZodModel = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  endpoint: z.string().trim().min(1),
  bucket名称: z.string().trim().min(1),
  region: z.string().trim().min(1),
  accessKeyId: z.string().trim().min(1),
  secretKey: z.string().trim().min(1),
})

export type S3Target编辑Model = z.infer<typeof s3Target编辑ZodModel>;
