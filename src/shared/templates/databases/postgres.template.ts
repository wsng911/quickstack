import { Constants } from "@/shared/utils/constants";
import { AppTemplateContentModel, AppTemplateModel } from "../../model/app-template.model";

export function getPostgresAppTemplate(config?: {
    app名称?: string,
    db名称?: string,
    db用户名?: string,
    db密码?: string
}): AppTemplateContentModel {
    return {
        input设置: [
            {
                key: "containerImageSource",
                label: "Container Image",
                value: "postgres:18-alpine",
                isEnvVar: false,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "POSTGRES_DB",
                label: "Database 名称",
                value: config?.db名称 || "postgresdb",
                isEnvVar: true,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "POSTGRES_USER",
                label: "Database User",
                value: config?.db用户名 || "postgresuser",
                isEnvVar: true,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "POSTGRES_PASSWORD",
                label: "Database 密码",
                value: config?.db密码 || "",
                isEnvVar: true,
                randomGeneratedIfEmpty: true,
            },
        ],
        appModel: {
            name: config?.app名称 || "PostgreSQL",
            appType: 'POSTGRES',
            sourceType: 'CONTAINER',
            containerImageSource: "",
            replicas: 1,
            ingressNetworkPolicy: Constants.DEFAULT_INGRESS_NETWORK_POLICY_DATABASES,
            egressNetworkPolicy: Constants.DEFAULT_EGRESS_NETWORK_POLICY_DATABASES,
            envVars: `PGDATA=/var/lib/qs-postgres/data
`,
            useNetworkPolicy: true,
            healthCheckPeriodSeconds: Constants.DEFAULT_HEALTH_CHECK_PERIOD_SECONDS,
            healthCheckTimeoutSeconds: 5,
            healthCheckFailureThreshold: Constants.DEFAULT_HEALTH_CHECK_FAILURE_THRESHOLD,
        },
        appDomains: [],
        appVolumes: [{
            size: 300,
            containerMountPath: '/var/lib/qs-postgres',
            accessMode: 'ReadWriteOnce',
            storageClass名称: 'longhorn',
            shareWithOtherApps: false,
        }],
        appFileMounts: [],
        appPorts: [{
            port: 5432,
        }]
    };
}

export const postgreAppTemplate: AppTemplateModel = {
    name: "PostgreSQL",
    icon名称: 'postgres.svg',
    templates: [
        getPostgresAppTemplate()
    ]
};