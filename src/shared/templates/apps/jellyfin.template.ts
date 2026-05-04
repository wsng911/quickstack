import { Constants } from "@/shared/utils/constants";
import { AppTemplateModel } from "../../model/app-template.model";

export const jellyfinAppTemplate: AppTemplateModel = {
    name: "Jellyfin",
    icon名称: 'https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/icon-transparent.svg',
    templates: [{
        input设置: [
            {
                key: "containerImageSource",
                label: "Container Image",
                value: "jellyfin/jellyfin:latest",
                isEnvVar: false,
                randomGeneratedIfEmpty: false,
            },
        ],
        appModel: {
            name: "Jellyfin",
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
        },
        appDomains: [],
        appVolumes: [{
            size: 200,
            containerMountPath: '/config',
            accessMode: 'ReadWriteOnce',
            storageClass名称: 'longhorn',
            shareWithOtherApps: false,
        }, {
            size: 10000,
            containerMountPath: '/media',
            accessMode: 'ReadWriteOnce',
            storageClass名称: 'longhorn',
            shareWithOtherApps: false,
        }],
        appFileMounts: [],
        appPorts: [{
            port: 8096,
        }]
    }],
};
