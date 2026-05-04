import { stringToNumber } from "@/shared/utils/zod.utils";
import { z } from "zod";

export const appVolumeTypeZodModel = z.enum(["ReadWriteOnce", "ReadWriteMany"]);
export const storageClass名称ZodModel = z.enum(["longhorn", "local-path"]);

export const appVolume编辑ZodModel = z.object({
  containerMountPath: z.string().trim().min(1),
  size: stringToNumber,
  accessMode: appVolumeTypeZodModel.nullish().or(z.string().nullish()),
  storageClass名称: storageClass名称ZodModel.default("longhorn"),
  shareWithOtherApps: z.boolean().optional().default(false),
  sharedVolumeId: z.string().nullish(),
});

export type AppVolume编辑Model = z.infer<typeof appVolume编辑ZodModel>;
