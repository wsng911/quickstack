import { Constants } from "@/shared/utils/constants";
import { AppTemplateContentModel, AppTemplateModel } from "../../model/app-template.model";

export function getMongodbAppTemplate(config?: {
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
                value: "mongo:7",
                isEnvVar: false,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "MONGO_INITDB_DATABASE",
                label: "Database 名称",
                value: config?.db名称 || "mongodb",
                isEnvVar: true,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "MONGO_INITDB_ROOT_USERNAME",
                label: "用户名",
                value: config?.db用户名 || "mongodbuser",
                isEnvVar: true,
                randomGeneratedIfEmpty: false,
            },
            {
                key: "MONGO_INITDB_ROOT_PASSWORD",
                label: "密码",
                value: config?.db密码 || "",
                isEnvVar: true,
                randomGeneratedIfEmpty: true,
            },
        ],
        appModel: {
            name: config?.app名称 || "MongoDB",
            appType: 'MONGODB',
            sourceType: 'CONTAINER',
            containerImageSource: "",
            ingressNetworkPolicy: Constants.DEFAULT_INGRESS_NETWORK_POLICY_DATABASES,
            egressNetworkPolicy: Constants.DEFAULT_EGRESS_NETWORK_POLICY_DATABASES,
            healthCheckFailureThreshold: Constants.DEFAULT_HEALTH_CHECK_FAILURE_THRESHOLD,
            replicas: 1,
            envVars: ``,
            useNetworkPolicy: true,
            healthCheckPeriodSeconds: 15,
            healthCheckTimeoutSeconds: 5,
        },
        appDomains: [],
        appVolumes: [{
            size: 500,
            containerMountPath: '/data/db',
            accessMode: 'ReadWriteOnce',
            storageClass名称: 'longhorn',
            shareWithOtherApps: false,
        }],
        appFileMounts: [],
        appPorts: [{
            port: 27017,
        }]
    };
}

export const mongodbAppTemplate: AppTemplateModel = {
    name: "MongoDB",
    icon名称: 'mongodb.svg',
    templates: [
        getMongodbAppTemplate()
    ],
};