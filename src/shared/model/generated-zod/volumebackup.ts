import * as z from "zod"

import { CompleteAppVolume, RelatedAppVolumeModel, CompleteS3Target, RelatedS3TargetModel } from "./index"

export const Volume返回upModel = z.object({
  id: z.string(),
  volumeId: z.string(),
  targetId: z.string(),
  cron: z.string(),
  retention: z.number().int(),
  useDatabase返回up: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteVolume返回up extends z.infer<typeof Volume返回upModel> {
  volume: CompleteAppVolume
  target: CompleteS3Target
}

/**
 * RelatedVolume返回upModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedVolume返回upModel: z.ZodSchema<CompleteVolume返回up> = z.lazy(() => Volume返回upModel.extend({
  volume: RelatedAppVolumeModel,
  target: RelatedS3TargetModel,
}))
