import { Constants } from "@/shared/utils/constants";
import { AppTemplateModel } from "../../model/app-template.model";

export const prometheusAppTemplate: AppTemplateModel = {
    name: "Prometheus",
    icon名称: 'https://raw.githubusercontent.com/prometheus/prometheus/main/documentation/images/prometheus-logo.svg',
    templates: [{
        input设置: [
            {
                key: "containerImageSource",
                label: "Container Image",
                value: "prom/prometheus:latest",
                isEnvVar: false,
                randomGeneratedIfEmpty: false,
            },
        ],
        appModel: {
            name: "Prometheus",
            appType: 'APP',
            sourceType: 'CONTAINER',
            containerImageSource: "",
            replicas: 1,
            ingressNetworkPolicy: Constants.DEFAULT_INGRESS_NETWORK_POLICY_APPS,
            egressNetworkPolicy: Constants.DEFAULT_EGRESS_NETWORK_POLICY_APPS,
            envVars: ``,
            useNetworkPolicy: true,
            healthCheckPeriodSeconds: 15,
            healthCheckTimeoutSeconds: 5,
            healthCheckFailureThreshold: Constants.DEFAULT_HEALTH_CHECK_FAILURE_THRESHOLD,
        },
        appDomains: [],
        appVolumes: [{
            size: 500,
            containerMountPath: '/prometheus',
            accessMode: 'ReadWriteOnce',
            storageClass名称: 'longhorn',
            shareWithOtherApps: false,
        }],
        appFileMounts: [],
        appPorts: [{
            port: 9090,
        }]
    }],
};
