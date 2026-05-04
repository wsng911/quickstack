import { stringToBoolean } from "@/shared/utils/zod.utils";
import { z } from "zod";

export const registryStorageLocation设置ZodModel = z.object({
  registryStorageLocation: z.string(),
})

export type RegistryStorageLocation设置Model = z.infer<typeof registryStorageLocation设置ZodModel>;