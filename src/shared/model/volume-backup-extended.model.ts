import { z } from "zod";
import { S3TargetModel, Volume返回upModel } from "./generated-zod";

export const volume返回upExtendedZodModel = z.lazy(() => Volume返回upModel.extend({
  target: S3TargetModel
}))

export type Volume返回upExtendedModel = z.infer<typeof volume返回upExtendedZodModel>;
