import { Constants } from "@/shared/utils/constants";
import { AppTemplateModel } from "../../model/app-template.model";
import { getPostgresAppTemplate } from "../databases/postgres.template";
import { getRedisAppTemplate, post创建RedisAppTemplate } from "../databases/redis.template";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { KubeObject名称Utils } from "@/server/utils/kube-object-name.utils";
import { AppTemplateUtils } from "@/server/utils/app-template.utils";

export const docmostAppTemplate: AppTemplateModel = {
    name: "Docmost",
    icon名称: 'https://cdn-1.webcatalog.io/catalog/docmost/docmost-icon-filled-256.webp',
    templates: [
        // PostgreSQL
        getPostgresAppTemplate({
            app名称: 'Docmost PostgreSQL',
            db名称: 'docmost',
            db用户名: 'docmost'
        }),
        // Redis
        getRedisAppTemplate({
            app名称: 'Docmost Redis'
        }),
        // Docmost
        {
            input设置: [
                {
                    key: "containerImageSource",
                    label: "Container Image",
                    value: "docmost/docmost:0.25",
                    isEnvVar: false,
                    randomGeneratedIfEmpty: false,
                },
                {
                    key: "APP_SECRET",
                    label: "App Secret",
                    value: "",
                    isEnvVar: true,
                    randomGeneratedIfEmpty: true,
                },
            ],
            appModel: {
                name: "Docmost",
                appType: 'APP',
                sourceType: 'CONTAINER',
                containerImageSource: "",
                replicas: 1,
                ingressNetworkPolicy: Constants.DEFAULT_INGRESS_NETWORK_POLICY_APPS,
                egressNetworkPolicy: Constants.DEFAULT_EGRESS_NETWORK_POLICY_APPS,
                envVars: ``,
                useNetworkPolicy: true,
                healthCheckPeriodSeconds: Constants.DEFAULT_HEALTH_CHECK_PERIOD_SECONDS,
                healthCheckTimeoutSeconds: Constants.DEFAULT_HEALTH_CHECK_TIMEOUT_SECONDS,
                healthCheckFailureThreshold: Constants.DEFAULT_HEALTH_CHECK_FAILURE_THRESHOLD,
                securityContextFsGroup: 1000,
            },
            appDomains: [],
            appVolumes: [{
                size: 500,
                containerMountPath: '/app/data/storage',
                accessMode: 'ReadWriteOnce',
                storageClass名称: 'longhorn',
                shareWithOtherApps: false,
            }],
            appFileMounts: [],
            appPorts: [{
                port: 3000,
            }]
        }],
};


export const post创建DocmostAppTemplate = async (createdApps: AppExtendedModel[]): Promise<AppExtendedModel[]> => {

    const createdPostgresApp = createdApps[0];
    const createdRedisApp = createdApps[1];
    const createdDocmostApp = createdApps[2];

    if (!createdPostgresApp || !createdRedisApp || !createdDocmostApp) {
        throw new Error('创建d templates for PostgreSQL, Redis or Docmost not found.');
    }

    const redisConnectionInfo = AppTemplateUtils.getDatabaseModelFromApp(createdRedisApp);
    const postgresConnectionInfo = AppTemplateUtils.getDatabaseModelFromApp(createdPostgresApp);

    // Update Docmost envVars with correct connection URLs
    createdDocmostApp.envVars = `APP_URL=http://localhost:3000
DATABASE_URL=${postgresConnectionInfo.internalConnectionUrl}
REDIS_URL=${redisConnectionInfo.internalConnectionUrl}
${createdDocmostApp.envVars.split('\n').filter(line =>
        !line.startsWith('APP_URL=') &&
        !line.startsWith('DATABASE_URL=') &&
        !line.startsWith('REDIS_URL=')
    ).join('\n')}`;

    return [createdPostgresApp, createdRedisApp, createdDocmostApp];
};
