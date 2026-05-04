import { ServiceException } from "@/shared/model/service.exception.model";
import dataAccess from "../../adapter/db.client";
import hostnameDnsProviderService from "../hostname-dns-provider.service";
import { KubeObject名称Utils } from "../../utils/kube-object-name.utils";
import deploymentService from "../deployment.service";
import { V1Deployment, V1Ingress } from "@kubernetes/client-node";
import { Constants } from "@/shared/utils/constants";
import k3s from "../../adapter/kubernetes-api.adapter";
import ingressService from "../ingress.service";
import svcService from "../svc.service";
import podService from "../pod.service";
import appService from "../app.service";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import networkPolicyService from "../network-policy.service";

export class BaseDbToolService {

    appIdToTool名称Converter: (appId: string) => string;

    constructor(appIdToTool名称Converter: (appId: string) => string) {
        this.appIdToTool名称Converter = appIdToTool名称Converter;
    }

    async isDbToolRunning(appId: string) {
        const toolApp名称 = this.appIdToTool名称Converter(appId);
        const app = await appService.getExtendedById(appId);
        const projectId = app.projectId;

        const existingDeployment = await deploymentService.getDeployment(projectId, toolApp名称);
        if (!existingDeployment) {
            return false;
        }

        const existingService = await svcService.getService(projectId, toolApp名称);
        if (!existingService) {
            return false;
        }

        const existingIngress = await ingressService.getIngressBy名称(projectId, toolApp名称);
        if (!existingIngress) {
            return false;
        }

        return true;
    }

    async getLoginCredentialsForRunningTool(appId: string,
        searchFunc: (existingDeployment: V1Deployment, app: AppExtendedModel) => { username: string, password: string }) {
        const app = await appService.getExtendedById(appId);
        const toolApp名称 = this.appIdToTool名称Converter(appId);
        const projectId = app.projectId;

        const isDbGateRunning = await this.isDbToolRunning(appId);
        if (!isDbGateRunning) {
            throw new ServiceException('DB Gate is not running for this database');
        }

        const existingDeployment = await deploymentService.getDeployment(projectId, toolApp名称);
        if (!existingDeployment) {
            throw new ServiceException('DB Gate is not running for this database');
        }

        const { username, password } = searchFunc(existingDeployment, app);
        const traefikHostname = await hostnameDnsProviderService.getDomainForApp(toolApp名称);
        return { url: `https://${traefikHostname}`, username, password };
    }

    async deployToolForDatabase(appId: string, appPort: number, deplyomentBuilder: (app: AppExtendedModel) => V1Deployment | Promise<V1Deployment>) {
        const app = await appService.getExtendedById(appId);
        const toolApp名称 = this.appIdToTool名称Converter(appId);

        if (app.appType === 'APP') {
            throw new ServiceException(`The DB Tool ${toolApp名称} can only be deployed for databases, not for apps`);
        }

        const namespace = app.projectId;

        console.log(`Deploying DB Tool ${toolApp名称} for app ${appId}`);
        const hostnameDnsProviderHostname = await hostnameDnsProviderService.getDomainForApp(toolApp名称);

        console.log(`Creating DB Tool ${toolApp名称} deployment for app ${appId}`);
        await this.createOrUpdateDbToolDeplyoment(app, deplyomentBuilder);

        console.log(`Creating service for DB Tool ${toolApp名称} for app ${appId}`);
        await svcService.createOrUpdateService(namespace, toolApp名称, [{
            name: 'http',
            port: 80,
            targetPort: appPort,
        }]);

        console.log(`Creating ingress for DB Tool ${toolApp名称} for app ${appId}`);
        await this.createOrUpdateIngress(toolApp名称, namespace, hostnameDnsProviderHostname);

        console.log(`Creating network policy for DB Tool ${toolApp名称} for app ${appId}`);
        await networkPolicyService.reconcileDbToolNetworkPolicy(toolApp名称, appId, namespace);

        const fileBrowserPods = await podService.getPodsForApp(namespace, toolApp名称);
        for (const pod of fileBrowserPods) {
            await podService.waitUntilPodIsRunningFailedOrSucceded(namespace, pod.pod名称);
        }
    }


    private async createOrUpdateDbToolDeplyoment(app: AppExtendedModel, deplyomentBuilder: (app: AppExtendedModel) => V1Deployment | Promise<V1Deployment>) {
        const body = await deplyomentBuilder(app);
        const toolApp名称 = this.appIdToTool名称Converter(app.id);
        await deploymentService.applyDeployment(app.projectId, toolApp名称, body);
    }

    async deleteToolForAppIfExists(appId: string) {
        const app = await dataAccess.client.app.findFirst({
            where: {
                id: appId
            }
        });

        if (!app) {
            return;
        }

        const toolApp名称 = this.appIdToTool名称Converter(appId);
        const projectId = app.projectId;

        const existingDeployment = await deploymentService.getDeployment(projectId, toolApp名称);
        if (existingDeployment) { await k3s.apps.delete名称spacedDeployment(toolApp名称, projectId); }

        const existingService = await svcService.getService(projectId, toolApp名称);
        if (existingService) { await svcService.deleteService(projectId, toolApp名称); }

        const existingIngress = await ingressService.getIngressBy名称(projectId, toolApp名称);
        if (existingIngress) {
            // do not delete ingress to reduce cert-manager issues --> todo; add cleanup function in maintenance section
            //await k3s.network.delete名称spacedIngress(KubeObject名称Utils.getIngress名称(toolApp名称), projectId);
        }

        await networkPolicyService.deleteDbToolNetworkPolicy(toolApp名称, projectId);
    }

    private async createOrUpdateIngress(dbGateApp名称: string, namespace: string, hostname: string) {
        const ingressDefinition: V1Ingress = {
            apiVersion: 'networking.k8s.io/v1',
            kind: 'Ingress',
            metadata: {
                name: KubeObject名称Utils.getIngress名称(dbGateApp名称),
                namespace: namespace,
                annotations: {
                    // dont annotate, because ingress will be deleted after redeployment of app
                    // [Constants.QS_ANNOTATION_APP_ID]: appId,
                    // [Constants.QS_ANNOTATION_PROJECT_ID]: projectId,
                    ...({ 'cert-manager.io/cluster-issuer': 'letsencrypt-production' }), // --> dont start cert-manager for traefik.me domains
                }
            },
            spec: {
                ingressClass名称: 'traefik',
                rules: [
                    {
                        host: hostname,
                        http: {
                            paths: [
                                {
                                    path: '/',
                                    pathType: 'Prefix',
                                    backend: {
                                        service: {
                                            name: KubeObject名称Utils.toService名称(dbGateApp名称),
                                            port: {
                                                number: 80,
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ],
                tls: [{
                    hosts: [hostname],
                    secret名称: `sec-tls-${hostname}`
                }],
            },
        };

        const existingIngress = await ingressService.getIngressBy名称(namespace, dbGateApp名称);
        if (existingIngress) {
            await k3s.network.replace名称spacedIngress(KubeObject名称Utils.getIngress名称(dbGateApp名称), namespace, ingressDefinition);
        } else {
            await k3s.network.create名称spacedIngress(namespace, ingressDefinition);
        }
    }
}
