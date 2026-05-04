import { Constants } from "@/shared/utils/constants";
import { AppTemplateModel } from "../../model/app-template.model";

export const immichAppTemplate: AppTemplateModel = {
    name: "Immich",
    icon名称: 'https://raw.githubusercontent.com/immich-app/immich/main/design/immich-logo.svg',
    templates: [{
        input设置: [
            {
                key: "containerImageSource",
                label: "Container Image",
                value: "ghcr.io/immich-app/immich-server:release",
                isEnvVar: false,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "DB_PASSWORD",
                label: "Database 密码",
                value: "",
                isEnvVar: true,
                randomGeneratedIfEmpty: true,
            },
        ],
        appModel: {
            name: "Immich",
            appType: 'APP',
            sourceType: 'CONTAINER',
            containerImageSource: "",
            replicas: 1,
            ingressNetworkPolicy: Constants.DEFAULT_INGRESS_NETWORK_POLICY_APPS,
            egressNetworkPolicy: Constants.DEFAULT_EGRESS_NETWORK_POLICY_APPS,
            envVars: `DB_HOSTNAME=immich_postgres
DB_USERNAME=postgres
DB_DATABASE_NAME=immich
REDIS_HOSTNAME=immich_redis
`,
            useNetworkPolicy: true,
            healthCheckPeriodSeconds: Constants.DEFAULT_HEALTH_CHECK_PERIOD_SECONDS,
            healthCheckTimeoutSeconds: Constants.DEFAULT_HEALTH_CHECK_TIMEOUT_SECONDS,
            healthCheckFailureThreshold: Constants.DEFAULT_HEALTH_CHECK_FAILURE_THRESHOLD,
        },
        appDomains: [],
        appVolumes: [{
            size: 10000,
            containerMountPath: '/usr/src/app/upload',
            accessMode: 'ReadWriteOnce',
            storageClass名称: 'longhorn',
            shareWithOtherApps: false,
        }],
        appFileMounts: [],
        appPorts: [{
            port: 2283,
        }]
    }],
};
