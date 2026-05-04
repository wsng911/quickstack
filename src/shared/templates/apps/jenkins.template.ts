import { Constants } from "@/shared/utils/constants";
import { AppTemplateModel } from "../../model/app-template.model";

export const jenkinsAppTemplate: AppTemplateModel = {
    name: "Jenkins",
    icon名称: 'https://www.jenkins.io/images/logos/jenkins/jenkins.svg',
    templates: [{
        input设置: [
            {
                key: "containerImageSource",
                label: "Container Image",
                value: "jenkins/jenkins:lts",
                isEnvVar: false,
                randomGeneratedIfEmpty: false,
            },
        ],
        appModel: {
            name: "Jenkins",
            appType: 'APP',
            sourceType: 'CONTAINER',
            containerImageSource: "",
            replicas: 1,
            ingressNetworkPolicy: Constants.DEFAULT_INGRESS_NETWORK_POLICY_APPS,
            egressNetworkPolicy: Constants.DEFAULT_EGRESS_NETWORK_POLICY_APPS,
            envVars: `JAVA_OPTS=-Djenkins.install.runSetupWizard=true
`,
            useNetworkPolicy: true,
            healthCheckPeriodSeconds: 60,
            healthCheckTimeoutSeconds: 30,
            healthCheckFailureThreshold: Constants.DEFAULT_HEALTH_CHECK_FAILURE_THRESHOLD,
        },
        appDomains: [],
        appVolumes: [{
            size: 2000,
            containerMountPath: '/var/jenkins_home',
            accessMode: 'ReadWriteOnce',
            storageClass名称: 'longhorn',
            shareWithOtherApps: false,
        }],
        appFileMounts: [],
        appPorts: [{
            port: 8080,
        }, {
            port: 50000,
        }]
    }],
};
