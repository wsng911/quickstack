import { z } from "zod";

export const system返回upLocation设置ZodModel = z.object({
  system返回upLocation: z.string(),
})

export type System返回upLocation设置Model = z.infer<typeof system返回upLocation设置ZodModel>;
