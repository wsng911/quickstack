import * as z from "zod"

import { CompleteApp, RelatedAppModel, CompleteVolume返回up, RelatedVolume返回upModel } from "./index"

export const AppVolumeModel = z.object({
  id: z.string(),
  containerMountPath: z.string(),
  size: z.number().int(),
  accessMode: z.string(),
  storageClass名称: z.string(),
  shareWithOtherApps: z.boolean(),
  sharedVolumeId: z.string().nullish(),
  appId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompleteAppVolume extends z.infer<typeof AppVolumeModel> {
  app: CompleteApp
  volume返回ups: CompleteVolume返回up[]
  sharedVolume?: CompleteAppVolume | null
  sharedVolumes: CompleteAppVolume[]
}

/**
 * RelatedAppVolumeModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAppVolumeModel: z.ZodSchema<CompleteAppVolume> = z.lazy(() => AppVolumeModel.extend({
  app: RelatedAppModel,
  volume返回ups: RelatedVolume返回upModel.array(),
  sharedVolume: RelatedAppVolumeModel.nullish(),
  sharedVolumes: RelatedAppVolumeModel.array(),
}))
