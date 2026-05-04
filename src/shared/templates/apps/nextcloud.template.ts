import { Constants } from "@/shared/utils/constants";
import { AppTemplateModel } from "../../model/app-template.model";

export const nextcloudAppTemplate: AppTemplateModel = {
    name: "Nextcloud",
    icon名称: 'https://avatars.githubusercontent.com/u/19211038',
    templates: [{
        input设置: [
            {
                key: "containerImageSource",
                label: "Container Image",
                value: "nextcloud:stable",
                isEnvVar: false,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "NEXTCLOUD_ADMIN_USER",
                label: "Admin 用户名",
                value: "admin",
                isEnvVar: true,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "NEXTCLOUD_ADMIN_PASSWORD",
                label: "Admin 密码",
                value: "",
                isEnvVar: true,
                randomGeneratedIfEmpty: true,
            },
        ],
        appModel: {
            name: "Nextcloud",
            appType: 'APP',
            sourceType: 'CONTAINER',
            containerImageSource: "",
            replicas: 1,
            ingressNetworkPolicy: Constants.DEFAULT_INGRESS_NETWORK_POLICY_APPS,
            egressNetworkPolicy: Constants.DEFAULT_EGRESS_NETWORK_POLICY_APPS,
            envVars: `SQLITE_DATABASE=nextcloud
`,
            useNetworkPolicy: true,
            healthCheckPeriodSeconds: Constants.DEFAULT_HEALTH_CHECK_PERIOD_SECONDS,
            healthCheckTimeoutSeconds: Constants.DEFAULT_HEALTH_CHECK_TIMEOUT_SECONDS,
            healthCheckFailureThreshold: Constants.DEFAULT_HEALTH_CHECK_FAILURE_THRESHOLD,
        },
        appDomains: [],
        appVolumes: [{
            size: 5000,
            containerMountPath: '/var/www/html',
            accessMode: 'ReadWriteOnce',
            storageClass名称: 'longhorn',
            shareWithOtherApps: false,
        }],
        appFileMounts: [],
        appPorts: [{
            port: 80,
        }]
    }],
};
