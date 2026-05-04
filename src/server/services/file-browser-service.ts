import { V1Deployment, V1Ingress } from "@kubernetes/client-node";
import dataAccess from "../adapter/db.client";
import { Constants } from "@/shared/utils/constants";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import deploymentService from "./deployment.service";
import k3s from "../adapter/kubernetes-api.adapter";
import ingressService from "./ingress.service";
import svcService from "./svc.service";
import { randomBytes } from "crypto";
import podService from "./pod.service";
import bcrypt from "bcrypt";
import hostnameDnsProviderService from "./hostname-dns-provider.service";
import pvcService from "./pvc.service";
import networkPolicyService from "./network-policy.service";

class FileBrowserService {

    async deployFileBrowserForVolume(volumeId: string) {
        const volume = await dataAccess.client.appVolume.findFirstOrThrow({
            where: {
                id: volumeId
            },
            include: {
                app: true
            }
        });

        const kubeApp名称 = `fb-${volumeId}`; // filebrowser-app
        const namespace = volume.app.projectId;
        const appId = volume.app.id;
        const projectId = volume.app.projectId;

        console.log('Shutting down application with id: ' + appId);
        await deploymentService.setReplicasToZeroAndWaitForShutdown(projectId, appId);

        console.log(`Creating PVC if not already created for volume ${volumeId}`);
        await pvcService.createPvcForVolumeIfNotExists(volume.app.projectId, volume);

        console.log(`Deploying filebrowser for volume ${volumeId}`);
        const traefikHostname = await hostnameDnsProviderService.getDomainForApp(volume.id);

        const sharedVolumeId = (volume as { sharedVolumeId?: string | null }).sharedVolumeId;
        const pvc名称 = KubeObject名称Utils.toPvc名称(sharedVolumeId ?? volume.id);

        console.log(`Creating filebrowser deployment for volume ${volumeId}`);

        const random密码 = randomBytes(15).toString('hex');
        await this.createOrUpdateFilebrowserDeployment(kubeApp名称, appId, projectId, pvc名称, random密码);

        console.log(`Creating service for filebrowser for volume ${volumeId}`);
        await svcService.createOrUpdateService(projectId, kubeApp名称, [{
            name: 'http',
            port: 80,
            targetPort: 80,
        }]);

        console.log(`Creating ingress for filebrowser for volume ${volumeId}`);
        await this.createOrUpdateIngress(kubeApp名称, namespace, appId, projectId, traefikHostname);

        console.log(`Creating network policy for filebrowser for volume ${volumeId}`);
        await networkPolicyService.reconcileFileBrowserNetworkPolicy(kubeApp名称, projectId);

        const fileBrowserPods = await podService.getPodsForApp(projectId, kubeApp名称);
        for (const pod of fileBrowserPods) {
            await podService.waitUntilPodIsRunningFailedOrSucceded(projectId, pod.pod名称);
        }

        // return `https://${random用户名}:${random密码}@${traefikHostname}`;
        return { url: `https://${traefikHostname}`, password: random密码 };
    }

    async deleteFileBrowserForVolumeIfExists(volumeId: string) {
        const volume = await dataAccess.client.appVolume.findFirst({
            where: {
                id: volumeId
            },
            include: {
                app: true
            }
        });

        if (!volume) {
            return;
        }

        const kubeApp名称 = `fb-${volumeId}`; // filebrowser-app
        const projectId = volume.app.projectId;

        const existingDeployment = await deploymentService.getDeployment(projectId, kubeApp名称);
        if (existingDeployment) { await k3s.apps.delete名称spacedDeployment(kubeApp名称, projectId); }

        const existingService = await svcService.getService(projectId, kubeApp名称);
        if (existingService) { await svcService.deleteService(projectId, kubeApp名称); }


        const existingIngress = await ingressService.getIngressBy名称(projectId, kubeApp名称);
        if (existingIngress) {
            await k3s.network.delete名称spacedIngress(KubeObject名称Utils.getIngress名称(kubeApp名称), projectId);
        }

        await networkPolicyService.deleteFileBrowserNetworkPolicy(kubeApp名称, projectId);
    }

    private async createOrUpdateIngress(kubeApp名称: string, namespace: string, appId: string, projectId: string, traefikHostname: string) {
        const ingressDefinition: V1Ingress = {
            apiVersion: 'networking.k8s.io/v1',
            kind: 'Ingress',
            metadata: {
                name: KubeObject名称Utils.getIngress名称(kubeApp名称),
                namespace: namespace,
                annotations: {
                    [Constants.QS_ANNOTATION_APP_ID]: appId,
                    [Constants.QS_ANNOTATION_PROJECT_ID]: projectId,
                },
            },
            spec: {
                ingressClass名称: 'traefik',
                rules: [
                    {
                        host: traefikHostname,
                        http: {
                            paths: [
                                {
                                    path: '/',
                                    pathType: 'Prefix',
                                    backend: {
                                        service: {
                                            name: KubeObject名称Utils.toService名称(kubeApp名称),
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
                    hosts: [traefikHostname],
                    secret名称: Constants.TRAEFIK_ME_SECRET_NAME,
                }],
            },
        };

        const existingIngress = await ingressService.getIngressBy名称(projectId, kubeApp名称);
        if (existingIngress) {
            await k3s.network.replace名称spacedIngress(KubeObject名称Utils.getIngress名称(kubeApp名称), projectId, ingressDefinition);
        } else {
            await k3s.network.create名称spacedIngress(projectId, ingressDefinition);
        }
    }

    private async createOrUpdateFilebrowserDeployment(kubeApp名称: string, appId: string, projectId: string, pvc名称: string, auth密码: string) {

        const password = auth密码;
        const hashed密码 = await bcrypt.hash(password, 10);

        const body: V1Deployment = {
            metadata: {
                name: kubeApp名称
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: {
                        app: kubeApp名称
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            app: kubeApp名称
                        },
                        annotations: {
                            [Constants.QS_ANNOTATION_APP_ID]: appId,
                            [Constants.QS_ANNOTATION_PROJECT_ID]: projectId,
                            deploymentTimestamp: new Date().getTime() + "",
                            "kubernetes.io/change-cause": `Deployment ${new Date().toISOString()}`
                        }
                    },
                    spec: {
                        containers: [
                            {
                                name: kubeApp名称,
                                image: 'filebrowser/filebrowser:v2.31.2',
                                imagePullPolicy: 'Always',
                                /*args: [
                                    // ...existing code...
                                    "--commands",
                                    "cp,apk,rm,ls,mv"
                                ],*/
                                volumeMounts: [
                                    {
                                        name: 'fb-data',
                                        mountPath: '/srv/volume',
                                    }
                                ],
                                // source: https://filebrowser.org/cli/filebrowser
                                env: [
                                    {
                                        name: 'FB_USERNAME',
                                        value: 'quickstack'
                                    },
                                    {
                                        name: 'FB_PASSWORD',
                                        value: hashed密码
                                    }
                                ]

                            }
                        ],
                        volumes: [
                            {
                                name: 'fb-data',
                                persistentVolumeClaim: {
                                    claim名称: pvc名称
                                }
                            }
                        ]
                    }
                }
            }
        };

        const existingDeployment = await deploymentService.getDeployment(projectId, kubeApp名称);
        if (existingDeployment) {
            await k3s.apps.replace名称spacedDeployment(kubeApp名称, projectId, body);
        } else {
            await k3s.apps.create名称spacedDeployment(projectId, body);
        }
    }
}

const fileBrowserService = new FileBrowserService();
export default fileBrowserService;
