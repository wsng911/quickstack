import { z } from "zod";
import { AppDomainModel, AppFileMountModel, AppModel, AppPortModel, AppVolumeModel, RelatedAppDomainModel, RelatedAppPortModel, RelatedAppVolumeModel } from "./generated-zod";
import { appSourceTypeZodModel, appTypeZodModel } from "./app-source-info.model";
import { appVolumeTypeZodModel, storageClass名称ZodModel } from "./volume-edit.model";

const appModelWithRelations = z.lazy(() => AppModel.extend({
    projectId: z.undefined(),
    buildMethod: z.undefined(),
    dockerfilePath: z.undefined(),
    appType: appTypeZodModel,
    sourceType: appSourceTypeZodModel,
    id: z.undefined(),
    createdAt: z.undefined(),
    updatedAt: z.undefined(),
}));

export const appTemplateInput设置ZodModel = z.object({
    key: z.string(),
    label: z.string(),
    value: z.any(),
    isEnvVar: z.boolean(),
    randomGeneratedIfEmpty: z.boolean(),
});
export type AppTemplateInput设置Model = z.infer<typeof appTemplateInput设置ZodModel>;

export const appTemplateContentZodModel = z.object({
    input设置: appTemplateInput设置ZodModel.array(),
    appModel: appModelWithRelations,
    appDomains: AppDomainModel.array(),
    appVolumes: AppVolumeModel.extend({
        accessMode: appVolumeTypeZodModel,
        storageClass名称: storageClass名称ZodModel.default('longhorn'),
        id: z.undefined(),
        appId: z.undefined(),
        createdAt: z.undefined(),
        updatedAt: z.undefined(),
    }).array(),
    appFileMounts: AppFileMountModel.extend({
        id: z.undefined(),
        appId: z.undefined(),
        createdAt: z.undefined(),
        updatedAt: z.undefined(),
    }).array(),
    appPorts: AppPortModel.extend({
        id: z.undefined(),
        appId: z.undefined(),
        createdAt: z.undefined(),
        updatedAt: z.undefined(),
    }).array(),
});
export type AppTemplateContentModel = z.infer<typeof appTemplateContentZodModel>;

export const appTemplateZodModel = z.object({
    name: z.string(),
    icon名称: z.string().nullish(),
    templates: appTemplateContentZodModel.array(),
});

export type AppTemplateModel = z.infer<typeof appTemplateZodModel>;
