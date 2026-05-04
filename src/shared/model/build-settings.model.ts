import { stringToOptionalNumber } from "@/shared/utils/zod.utils";
import { z } from "zod";

export const build设置ZodModel = z.object({
    memoryReservation: stringToOptionalNumber,
    memoryLimit: stringToOptionalNumber,
    cpuReservation: stringToOptionalNumber,
    cpuLimit: stringToOptionalNumber,
    buildNode: z.string().optional().nullable(),
});

export type Build设置Model = z.infer<typeof build设置ZodModel>;
