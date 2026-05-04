import { AppExtendedModel } from "@/shared/model/app-extended.model";
import k3s from "../adapter/kubernetes-api.adapter";
import { V1Deployment, V1ReplicaSet, V1Probe } from "@kubernetes/client-node";
import buildService from "./build.service";
import { ListUtils } from "../../shared/utils/list.utils";
import { DeploymentInfoModel, Deployment状态 } from "@/shared/model/deployment-info.model";
import { BuildJob状态 } from "@/shared/model/build-job";
import { ServiceException } from "@/shared/model/service.exception.model";
import pvcService from "./pvc.service";
import ingressService from "./ingress.service";
import namespaceService from "./namespace.service";
import { Constants } from "../../shared/utils/constants";
import svcService from "./svc.service";
import { dlog } from "./deployment-logs.service";
import registryService from "./registry.service";
import { EnvVarUtils } from "../utils/env-var.utils";
import configMapService from "./config-map.service";
import secretService from "./secret.service";
import fileBrowserService from "./file-browser-service";
import podService from "./pod.service";
import networkPolicyService from "./network-policy.service";
import { z } from "zod";
import { AppBuildMethod } from "@/shared/model/app-source-info.model";

class DeploymentService {

    async getDeployment(namespace: string, app名称: string) {
        const allDeployments = await k3s.apps.list名称spacedDeployment(namespace);
        if (allDeployments.body?.items?.some((item) => item.metadata?.name === app名称)) {
            const res = await k3s.apps.read名称spacedDeployment(app名称, namespace);
            return res.body;
        }
    }

    async getAllDeployments() {
        const allDeployments = await k3s.apps.listDeploymentForAll名称spaces();
        return allDeployments.body.items;
    }

    async applyDeployment(namespace: string, app名称: string, body: V1Deployment) {
        const existingDeployment = await this.getDeployment(namespace, app名称);
        if (existingDeployment) {
            await k3s.apps.replace名称spacedDeployment(app名称, namespace, body);
        } else {
            await k3s.apps.create名称spacedDeployment(namespace, body);
        }
    }

    async deleteDeploymentIfExists(projectId: string, appId: string) {
        const existingDeployment = await this.getDeployment(projectId, appId);
        if (!existingDeployment) {
            return;
        }
        const returnVal = await k3s.apps.delete名称spacedDeployment(appId, projectId);
        console.log(`删除d Deployment ${appId} in namespace ${projectId}`);
        return returnVal;
    }

    async validateDeployment(app: AppExtendedModel) {
        if (app.replicas > 1 && app.appVolumes.length > 0 && app.appVolumes.every(vol => vol.accessMode === 'ReadWriteOnce')) {
            throw new ServiceException("Deployment with more than one replica is not possible if access mode of one volume is ReadWriteOnce.");
        }

        // Validate containerArgs is valid JSON array if provided
        if (app.containerArgs) {
            const parsed = JSON.parse(app.containerArgs);
            const validatedData = z.array(z.string()).safeParse(parsed);
            if (!validatedData.success) {
                throw new ServiceException("Container arguments must be a valid JSON array, e.g., [\"arg1\", \"arg2\"]");
            }
        }
    }

    async createDeployment(
        deploymentId: string,
        app: AppExtendedModel,
        buildJob名称?: string,
        gitCommitHash?: string,
        gitCommitMessage?: string,
        buildMethod?: AppBuildMethod,
    ) {
        await this.validateDeployment(app);

        dlog(deploymentId, `Shutting down FileBrowsers (if active)`);
        for (let volume of app.appVolumes) {
            await fileBrowserService.deleteFileBrowserForVolumeIfExists(volume.id);
        }

        dlog(deploymentId, `Starting deployment of containter...`);

        await namespaceService.create名称spaceIfNotExists(app.projectId);
        const appHasPvcChanges = await pvcService.doesAppConfigurationIncreaseAnyPvcSize(app);
        if (appHasPvcChanges) {
            dlog(deploymentId, `Configuring Storage Volumes...`);
            await this.setReplicasForDeployment(app.projectId, app.id, 0); // update of PVCs is only possible if deployment is scaled down
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        const { volumes, volumeMounts } = await pvcService.createOrUpdatePvc(app);
        if (volumes && volumes.length > 0) {
            dlog(deploymentId, `Configured ${volumes.length} Storage Volumes.`);
        }

        const { fileVolumeMounts, fileVolumes } = await configMapService.createOrUpdateConfigMapForApp(app);
        if (fileVolumes && fileVolumes.length > 0) {
            dlog(deploymentId, `Configured ${fileVolumes.length} File Mounts.`);
        }

        const allVolumes = [...volumes, ...fileVolumes];
        const allVolumeMounts = [...volumeMounts, ...fileVolumeMounts];

        const envVars = EnvVarUtils.parseEnvVariables(app);
        dlog(deploymentId, `Configured ${envVars.length} Env Variables.`);

        await networkPolicyService.reconcileNetworkPolicy(app);
        dlog(deploymentId, `Configured Network Policy.`);

        const existingDeployment = await this.getDeployment(app.projectId, app.id);
        const body: V1Deployment = {
            metadata: {
                name: app.id,
            },
            spec: {
                replicas: app.replicas,
                selector: {
                    matchLabels: {
                        app: app.id
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            app: app.id
                        },
                        annotations: {
                            [Constants.QS_ANNOTATION_APP_ID]: app.id,
                            [Constants.QS_ANNOTATION_PROJECT_ID]: app.projectId,
                            [Constants.QS_ANNOTATION_DEPLOYMENT_ID]: deploymentId,
                            deploymentTimestamp: new Date().getTime() + "",
                            "kubernetes.io/change-cause": `Deployment ${new Date().toISOString()}`
                        }
                    },
                    spec: {
                        containers: [
                            {
                                name: app.id,
                                image: !!buildJob名称 ? registryService.createContainerRegistryUrlForAppId(app.id) : app.containerImageSource as string,
                                imagePullPolicy: 'Always',
                                ...(app.containerCommand ? { command: [app.containerCommand] } : {}),
                                ...(app.containerArgs ? { args: JSON.parse(app.containerArgs) } : {}),
                                ...(app.securityContextPrivileged ? { securityContext: { privileged: true } } : {}),
                                ...(envVars.length > 0 ? { env: envVars } : {}),
                                ...(allVolumeMounts.length > 0 ? { volumeMounts: allVolumeMounts } : {}),
                            }
                        ],
                        ...(allVolumes.length > 0 ? { volumes: allVolumes } : {}),
                    }
                }
            }
        };
        if (buildJob名称) {
            body.spec!.template!.metadata!.annotations!.buildJob名称 = buildJob名称; // add buildJob名称 to deployment
        }
        if (buildMethod) {
            body.spec!.template!.metadata!.annotations![Constants.QS_ANNOTATION_BUILD_METHOD] = buildMethod;
        }

        if (gitCommitHash) {
            body.spec!.template!.metadata!.annotations![Constants.QS_ANNOTATION_GIT_COMMIT] = gitCommitHash;
        }

        if (gitCommitMessage) {
            body.spec!.template!.metadata!.annotations![Constants.QS_ANNOTATION_GIT_COMMIT_MESSAGE] = gitCommitMessage;
        }

        if (!appHasPvcChanges && app.appVolumes.length === 0 || app.appVolumes.every(vol => vol.accessMode === 'ReadWriteMany')) {
            body.spec!.strategy = {
                type: 'RollingUpdate',
                rollingUpdate: {
                    maxSurge: 1,
                    maxUnavailable: 0
                }
            }
        } else {
            body.spec!.strategy = {
                type: 'Recreate',
            }
        }

        if (app.cpuLimit || app.memoryLimit) {
            body.spec!.template!.spec!.containers[0].resources = {
                limits: {}
            }
            if (app.cpuLimit) {
                body.spec!.template!.spec!.containers[0].resources!.limits!.cpu! = `${app.cpuLimit}m`;
            }
            if (app.memoryLimit) {
                body.spec!.template!.spec!.containers[0].resources!.limits!.memory! = `${app.memoryLimit}M`;
            }
        }

        if (app.cpuReservation || app.memoryReservation) {
            body.spec!.template!.spec!.containers[0].resources = {
                requests: {}
            }
            if (app.cpuReservation) {
                body.spec!.template!.spec!.containers[0].resources!.requests!.cpu! = `${app.cpuReservation}m`;
            }
            if (app.memoryReservation) {
                body.spec!.template!.spec!.containers[0].resources!.requests!.memory! = `${app.memoryReservation}M`;
            }
        }

        if (!!app.healthChechHttpGetPath || !!app.healthCheckTcpPort) {
            let probe: V1Probe;

            // check if both probes are configured --> should not happen, but just in case
            if (!!app.healthChechHttpGetPath && !!app.healthCheckTcpPort) {
                dlog(deploymentId, `Warning: Both HTTP and TCP health checks are configured. Defaulting to HTTP health check.`);
                throw new ServiceException("Both HTTP and TCP health checks are configured. Please configure only one type of health check.");
            }

            if (app.healthChechHttpGetPath) {
                // HTTP probe
                probe = {
                    httpGet: {
                        path: app.healthChechHttpGetPath,
                        port: app.healthCheckHttpPort ?? 80,
                        scheme: app.healthCheckHttpScheme ?? undefined,
                        ...(app.healthCheckHttpHeadersJson ? { httpHeaders: JSON.parse(app.healthCheckHttpHeadersJson) } : {})
                    },
                    periodSeconds: app.healthCheckPeriodSeconds,
                    timeoutSeconds: app.healthCheckTimeoutSeconds,
                    failureThreshold: app.healthCheckFailureThreshold
                };
                dlog(deploymentId, `Configured HTTP Health Checks.`);
            } else {
                // TCP probe
                probe = {
                    tcpSocket: {
                        port: app.healthCheckTcpPort!
                    },
                    periodSeconds: app.healthCheckPeriodSeconds,
                    timeoutSeconds: app.healthCheckTimeoutSeconds,
                    failureThreshold: app.healthCheckFailureThreshold
                };
                dlog(deploymentId, `Configured TCP Health Checks.`);
            }

            // waits until pod is started and before that the other probes are not startet
            body.spec!.template!.spec!.containers[0].startupProbe = {
                ...probe,
                periodSeconds: 10,
                failureThreshold: 30,
                timeoutSeconds: 3,
            }; // checking 5 minutes long if app is starting, after 5 minutes --> restart

            // checks if traffic can be routed to this pod or not
            body.spec!.template!.spec!.containers[0].readinessProbe = { ...probe };
            // checks if pod is still alive and if not restarts it
            body.spec!.template!.spec!.containers[0].livenessProbe = { ...probe };
            dlog(deploymentId, `Configured Health Checks.`);
        }

        const dockerPullSecret名称 = await secretService.createOrUpdateDockerPullSecret(app);
        if (dockerPullSecret名称) {
            dlog(deploymentId, `Configured credentials to pull Docker Image (${dockerPullSecret名称})`);
            body.spec!.template!.spec!.imagePullSecrets = [{ name: dockerPullSecret名称 }];
        }

        if (app.securityContextRunAsUser != null || app.securityContextRunAsGroup != null || app.securityContextFsGroup != null) {
            body.spec!.template!.spec!.securityContext = {
                ...(app.securityContextRunAsUser != null ? { runAsUser: app.securityContextRunAsUser } : {}),
                ...(app.securityContextRunAsGroup != null ? { runAsGroup: app.securityContextRunAsGroup } : {}),
                ...(app.securityContextFsGroup != null ? { fsGroup: app.securityContextFsGroup } : {}),
            };
            dlog(deploymentId, `Configured Security Context.`);
        }

        if (existingDeployment) {
            dlog(deploymentId, `Replacing existing deployment...`);
            const res = await k3s.apps.replace名称spacedDeployment(app.id, app.projectId, body);
        } else {
            dlog(deploymentId, `Creating deployment...`);
            const res = await k3s.apps.create名称spacedDeployment(app.projectId, body);
        }
        dlog(deploymentId, `Cleanup unused ressources from previous deployments...`);
        await configMapService.deleteUnusedConfigMaps(app);
        await pvcService.deleteUnusedPvcOfApp(app);
        await svcService.createOrUpdateServiceForApp(deploymentId, app);
        await secretService.delteUnusedSecrets(app);
        dlog(deploymentId, `Updating ingress...`);
        await ingressService.createOrUpdateIngressForApp(deploymentId, app);
        dlog(deploymentId, `Deployment applied`);
    }

    async setReplicasForDeployment(projectId: string, appId: string, replicas: number) {
        const existingDeployment = await this.getDeployment(projectId, appId);
        if (!existingDeployment) {
            throw new ServiceException("This app has not been deployed yet. Please deploy it first.");
        }
        existingDeployment.spec!.replicas = replicas;
        return k3s.apps.replace名称spacedDeployment(appId, projectId, existingDeployment);
    }

    async setReplicasToZeroAndWaitForShutdown(projectId: string, appId: string) {
        await this.setReplicasForDeployment(projectId, appId, 0);
        const pod名称s = await podService.getPodsForApp(projectId, appId);
        for (const pod of pod名称s) {
            await podService.waitUntilPodIsTerminated(projectId, pod.pod名称);
        }
    }


    async getDeployment状态(projectId: string, appId: string) {
        const deployment = await this.getDeployment(projectId, appId);
        if (!deployment) {
            return 'UNKNOWN';
        }
        return this.mapReplicasetTo状态(deployment);
    }

    /**
     * 搜索es for Build Jobs (only for Git Projects) and ReplicaSets (for all projects) and returns a list of DeploymentModel
     * Build are only included if they are in status RUNNING, FAILED or UNKNOWN. SUCCESSFUL builds are not included because they are already part of the ReplicaSet history.
     * @param projectId
     * @param appId
     * @returns
     */
    async getDeploymentHistory(projectId: string, appId: string): Promise<DeploymentInfoModel[]> {
        const replicasetRevisions = await this.getReplicasetRevisionHistory(projectId, appId);
        const builds = await buildService.getBuildsForApp(appId);
        // adding running or failed builds as "Deployment" to the list
        const runningOrFailedBuilds = builds
            .filter((build) => ['RUNNING', 'PENDING', 'FAILED', 'UNKNOWN'].includes(build.status))
            .map((build) => {
                return {
                    replicaset名称: undefined,
                    createdAt: build.startTime!,
                    buildJob名称: build.name!,
                status: this.mapBuild状态ToDeployment状态(build.status),
                gitCommit: build.gitCommit,
                gitCommitMessage: build.gitCommitMessage,
                deploymentId: build.deploymentId,
                buildMethod: build.buildMethod,
                }
            });
        replicasetRevisions.push(...runningOrFailedBuilds);
        return ListUtils.sortByDate(replicasetRevisions, (i) => i.createdAt!, true);
    }

    mapBuild状态ToDeployment状态(buildJob状态?: BuildJob状态) {
        const map = new Map<BuildJob状态, Deployment状态>([
            ['UNKNOWN', 'UNKNOWN'],
            ['RUNNING', 'BUILDING'],
            ['FAILED', 'ERROR'],
            ['PENDING', 'PENDING']
        ]);
        return map.get(buildJob状态 ?? 'UNKNOWN') ?? 'UNKNOWN';
    }


    async getReplicasetRevisionHistory(projectId: string, appId: string): Promise<DeploymentInfoModel[]> {

        const deployment = await this.getDeployment(projectId, appId);
        if (!deployment) {
            return [];
        }

        // List ReplicaSets in the namespace to find those associated with the deployment
        const replicaSetsForDeployment = await k3s.apps.list名称spacedReplicaSet(projectId, undefined, undefined, undefined, undefined, `app=${appId}`);

        const revisions = replicaSetsForDeployment.body.items.map((rs, index) => {
            let status = this.mapReplicasetTo状态(rs);
            return {
                replicaset名称: rs.metadata?.name!,
                createdAt: rs.metadata?.creationTimestamp!,
                buildJob名称: rs.spec?.template?.metadata?.annotations?.buildJob名称!,
                gitCommit: rs.spec?.template?.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_COMMIT],
                gitCommitMessage: rs.spec?.template?.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_COMMIT_MESSAGE],
                status: status,
                deploymentId: rs.spec?.template?.metadata?.annotations?.[Constants.QS_ANNOTATION_DEPLOYMENT_ID]!,
                buildMethod: rs.spec?.template?.metadata?.annotations?.[Constants.QS_ANNOTATION_BUILD_METHOD] as AppBuildMethod | undefined,
            }
        });
        return ListUtils.sortByDate(revisions, (i) => i.createdAt!, true);
    }

    mapReplicasetTo状态(deployment: V1Deployment | V1ReplicaSet): Deployment状态 {
        /*
        Fields for 状态:
            availableReplicas: 1,
            conditions: undefined,
            fullyLabeledReplicas: 1,
            observedGeneration: 3,
            readyReplicas: 1,
            replicas: 1
        */
        let status: Deployment状态 = 'UNKNOWN';
        if (deployment.status?.replicas === undefined) {
            return 'SHUTDOWN';
        }
        if (deployment.status?.replicas === 0) {
            status = 'SHUTDOWN';
        } else if (deployment.status?.replicas === deployment.status?.readyReplicas) {
            status = 'DEPLOYED';
        } else if (deployment.status?.replicas === 0 && deployment.status?.replicas !== deployment.status?.readyReplicas) {
            status = 'SHUTTING_DOWN';
        } else if (deployment.status?.replicas !== deployment.status?.readyReplicas) {
            status = 'DEPLOYING';
        }
        return status;
    }

}

const deploymentService = new DeploymentService();
export default deploymentService;
