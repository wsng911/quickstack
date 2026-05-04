import * as z from "zod"

import { CompleteVolume返回up, RelatedVolume返回upModel } from "./index"

export const S3TargetModel = z.object({
  id: z.string(),
  name: z.string(),
  bucket名称: z.string(),
  endpoint: z.string(),
  region: z.string(),
  accessKeyId: z.string(),
  secretKey: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteS3Target extends z.infer<typeof S3TargetModel> {
  volume返回ups: CompleteVolume返回up[]
}

/**
 * RelatedS3TargetModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedS3TargetModel: z.ZodSchema<CompleteS3Target> = z.lazy(() => S3TargetModel.extend({
  volume返回ups: RelatedVolume返回upModel.array(),
}))
