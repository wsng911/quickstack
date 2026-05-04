import { z } from "zod";

export const terminalSetupInfoZodModel = z.object({
    namespace: z.string().min(1),
    pod名称: z.string().min(1),
    container名称: z.string().min(1),
    terminalType: z.enum(['sh', 'bash']).default('bash').nullish(),
    terminalSessionKey: z.string().nullish(),
});

export type TerminalSetupInfoModel = z.infer<typeof terminalSetupInfoZodModel>;