import { Constants } from "@/shared/utils/constants";
import { AppTemplateContentModel, AppTemplateModel } from "../../model/app-template.model";

export function getMariadbAppTemplate(config?: {
    app名称?: string,
    db名称?: string,
    db用户名?: string,
    db密码?: string,
    root密码?: string
}): AppTemplateContentModel {
    return {
        input设置: [
            {
                key: "containerImageSource",
                label: "Container Image",
                value: "mariadb:11",
                isEnvVar: false,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "MYSQL_DATABASE",
                label: "Database 名称",
                value: config?.db名称 || "mariadb",
                isEnvVar: true,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "MYSQL_USER",
                label: "Database User",
                value: config?.db用户名 || "mariadbuser",
                isEnvVar: true,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "MYSQL_PASSWORD",
                label: "Database Passwort",
                value: config?.db密码 || "",
                isEnvVar: true,
                randomGeneratedIfEmpty: true,
            },
            {
                key: "MYSQL_ROOT_PASSWORD",
                label: "Root 密码",
                value: config?.root密码 || "",
                isEnvVar: true,
                randomGeneratedIfEmpty: true,
            },
        ],
        appModel: {
            name: config?.app名称 || "MariaDB",
            appType: 'MARIADB',
            sourceType: 'CONTAINER',
            containerImageSource: "",
            ingressNetworkPolicy: Constants.DEFAULT_INGRESS_NETWORK_POLICY_DATABASES,
            egressNetworkPolicy: Constants.DEFAULT_EGRESS_NETWORK_POLICY_DATABASES,
            replicas: 1,
            envVars: ``,
            useNetworkPolicy: true,
            healthCheckPeriodSeconds: 15,
            healthCheckTimeoutSeconds: 5,
            healthCheckFailureThreshold: Constants.DEFAULT_HEALTH_CHECK_FAILURE_THRESHOLD,
        },
        appDomains: [],
        appVolumes: [{
            size: 400,
            containerMountPath: '/var/lib/mysql',
            accessMode: 'ReadWriteOnce',
            storageClass名称: 'longhorn',
            shareWithOtherApps: false,
        }],
        appFileMounts: [],
        appPorts: [{
            port: 3306,
        }]
    };
}

export const mariadbAppTemplate: AppTemplateModel = {
    name: "MariaDB",
    icon名称: 'mariadb.svg',
    templates: [
        getMariadbAppTemplate()
    ]
};