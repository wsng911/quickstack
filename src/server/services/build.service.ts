import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { AppBuildMethod } from "@/shared/model/app-source-info.model";
import { BuildJobModel } from "@/shared/model/build-job";
import { GlobalBuildJobModel } from "@/shared/model/global-build-job.model";
import { PodsInfoModel } from "@/shared/model/pods-info.model";
import { ServiceException } from "@/shared/model/service.exception.model";
import { Constants } from "../../shared/utils/constants";
import dataAccess from "../adapter/db.client";
import k3s from "../adapter/kubernetes-api.adapter";
import buildQueueInitContainer from "./build-job-builders/build-init-container.service";
import dockerfileBuildJobBuilder from "./build-job-builders/dockerfile-build-job-builder.service";
import railpackBuildJobBuilder from "./build-job-builders/railpack-build-job-builder.service";
import { BuildJobBuilder } from "./build-job-builders/build-job-builder.interface";
import clusterService from "./cluster.service";
import { dlog } from "./deployment-logs.service";
import gitService from "./git.service";
import namespaceService from "./namespace.service";
import paramService, { ParamService } from "./param.service";
import registryService, { BUILD_NAMESPACE } from "./registry.service";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import { V1Job状态, V1ResourceRequirements } from "@kubernetes/client-node";
import appGitSshKeyService from "./app-git-ssh-key.service";

class BuildService {

    async buildApp(deploymentId: string, app: AppExtendedModel, forceBuild: boolean = false): Promise<[string, string, string, boolean]> {
        await namespaceService.create名称spaceIfNotExists(BUILD_NAMESPACE);
        const registryLocation = await paramService.getString(ParamService.REGISTRY_SOTRAGE_LOCATION, Constants.INTERNAL_REGISTRY_LOCATION);
        await registryService.deployRegistry(registryLocation!);

        const buildsForApp = await this.getBuildsForApp(app.id);
        if (buildsForApp.some((job) => job.status === 'RUNNING' || job.status === 'PENDING')) {
            throw new ServiceException("A build job is already running for this app.");
        }

        const buildMethod = this.getBuildMethod(app);
        await dlog(deploymentId, `Initialized app build...`);
        await dlog(deploymentId, `Selected build method: ${buildMethod}`);
        await dlog(deploymentId, `Trying to clone repository...`);

        const latestSuccessfulBuld = buildsForApp.find(x => x.status === 'SUCCEEDED');
        const { latestRemoteGitHash, latestRemoteGitCommitMessage } = await gitService.openGitContext(app, async (ctx) => {
            if (buildMethod === 'DOCKERFILE') {
                await ctx.checkIfDockerfileExists();
            }

            const [hash, message] = await Promise.all([
                ctx.getLatestRemoteCommitHash(),
                ctx.getLatestRemoteCommitMessage(),
            ]);
            return { latestRemoteGitHash: hash, latestRemoteGitCommitMessage: message };
        });

        await dlog(deploymentId, `Cloned repository successfully`);
        await dlog(deploymentId, `Latest remote git hash: ${latestRemoteGitHash}`);

        if (!forceBuild && latestSuccessfulBuld?.gitCommit && latestRemoteGitHash &&
            latestSuccessfulBuld.gitCommit === latestRemoteGitHash) {
            if (await registryService.doesImageExist(app.id, 'latest')) {
                await dlog(deploymentId, `Latest build is already up to date with git repository, using container from last build.`);
                return [latestSuccessfulBuld.name, latestRemoteGitHash, latestRemoteGitCommitMessage, true];
            }

            await dlog(deploymentId, `Docker Image for last build not found in internal registry, creating new build.`);
        }

        return this.createAndStartBuildJob(deploymentId, app, latestRemoteGitHash, latestRemoteGitCommitMessage);
    }

    private async createAndStartBuildJob(
        deploymentId: string,
        app: AppExtendedModel,
        latestRemoteGitHash: string,
        latestRemoteGitCommitMessage: string = '',
    ): Promise<[string, string, string, boolean]> {
        const build名称 = KubeObject名称Utils.addRandomSuffix(KubeObject名称Utils.toJob名称(app.id));
        const buildMethod = this.getBuildMethod(app);
        const builder = this.getBuilder(buildMethod);

        await dlog(deploymentId, `Creating build job with name: ${build名称}`);
        await buildQueueInitContainer.ensureRbacResources();

        if (buildMethod === 'DOCKERFILE') {
            await dlog(deploymentId, `Dockerfile path: ${app.dockerfilePath || './Dockerfile'}`);
        } else {
            await dlog(deploymentId, `Railpack build will run queue wait, prepare step, and BuildKit build in sequence.`);
        }

        const queuedAt = Date.now().toString();
        const schedulingConfig = await this.getBuildSchedulingConfig(deploymentId);
        const gitSshPrivateKeySecret名称 = app.sourceType === 'GIT_SSH'
            ? await appGitSshKeyService.createTemporaryBuildSecret(app.id, build名称)
            : undefined;

        try {
            const jobDefinition = await builder.buildJobDefinition({
                app,
                build名称,
                deploymentId,
                latestRemoteGitHash,
                latestRemoteGitCommitMessage,
                queuedAt,
                ...schedulingConfig,
                gitSshPrivateKeySecret名称,
            });

            await k3s.batch.create名称spacedJob(BUILD_NAMESPACE, jobDefinition);
        } catch (error) {
            await appGitSshKeyService.deleteTemporaryBuildSecret(gitSshPrivateKeySecret名称);
            throw error;
        }
        await dlog(deploymentId, `Build job ${build名称} scheduled successfully`);

        return [build名称, latestRemoteGitHash, latestRemoteGitCommitMessage, false];
    }

    private getBuildMethod(app: AppExtendedModel): AppBuildMethod {
        return app.buildMethod === 'DOCKERFILE' ? 'DOCKERFILE' : 'RAILPACK';
    }

    private getBuilder(buildMethod: AppBuildMethod): BuildJobBuilder {
        return buildMethod === 'DOCKERFILE' ? dockerfileBuildJobBuilder : railpackBuildJobBuilder;
    }

    private async getBuildSchedulingConfig(deploymentId: string): Promise<{
        nodeSelector?: Record<string, string>;
        resources?: V1ResourceRequirements;
    }> {
        const buildNode = await paramService.getString(ParamService.BUILD_NODE);
        let nodeSelector: Record<string, string> | undefined;
        let resources: V1ResourceRequirements | undefined;

        if (buildNode === Constants.BUILD_NODE_K3S_NATIVE_VALUE) {
            const [memoryLimit, memoryReservation, cpuLimit, cpuReservation] = await Promise.all([
                paramService.getNumber(ParamService.BUILD_MEMORY_LIMIT),
                paramService.getNumber(ParamService.BUILD_MEMORY_RESERVATION),
                paramService.getNumber(ParamService.BUILD_CPU_LIMIT),
                paramService.getNumber(ParamService.BUILD_CPU_RESERVATION),
            ]);
            const hasLimits = memoryLimit || cpuLimit;
            const hasRequests = memoryReservation || cpuReservation;
            if (hasLimits || hasRequests) {
                resources = {
                    ...(hasLimits ? {
                        limits: {
                            ...(cpuLimit ? { cpu: `${cpuLimit}m` } : {}),
                            ...(memoryLimit ? { memory: `${memoryLimit}M` } : {}),
                        }
                    } : {}),
                    ...(hasRequests ? {
                        requests: {
                            ...(cpuReservation ? { cpu: `${cpuReservation}m` } : {}),
                            ...(memoryReservation ? { memory: `${memoryReservation}M` } : {}),
                        }
                    } : {}),
                };
            }

            const resourceLimitsString = [
                memoryLimit ? `memory limit: ${memoryLimit}M` : null,
                memoryReservation ? `memory reservation: ${memoryReservation}M` : null,
                cpuLimit ? `CPU limit: ${cpuLimit}m` : null,
                cpuReservation ? `CPU reservation: ${cpuReservation}m` : null,
            ];
            await dlog(deploymentId, `Build scheduling: k3s native - ${resourceLimitsString.filter(Boolean).join(', ') || 'no resource limits or reservations configured'}`);
            return { resources };
        }

        if (buildNode) {
            const nodes = await clusterService.getNodeInfo();
            const targetNode = nodes.find(n => n.name === buildNode);
            if (!targetNode || !targetNode.schedulable) {
                throw new ServiceException(`Configured build node '${buildNode}' is not schedulable. Please update build settings.`);
            }

            nodeSelector = { 'kubernetes.io/hostname': buildNode };
            await dlog(deploymentId, `Build node pinned to: ${buildNode}`);
            return { nodeSelector };
        }

        try {
            const [nodeResources, nodeInfos] = await Promise.all([
                clusterService.getNodeResourceUsage(),
                clusterService.getNodeInfo(),
            ]);
            const schedulable名称s = new Set(nodeInfos.filter(n => n.schedulable).map(n => n.name));
            const bestNode = nodeResources
                .filter(n => schedulable名称s.has(n.name))
                .sort((a, b) => (b.ramCapacity - b.ramUsage) - (a.ramCapacity - a.ramUsage))[0];
            if (bestNode) {
                nodeSelector = { 'kubernetes.io/hostname': bestNode.name };
                await dlog(deploymentId, `Auto-selected build node with most available resources: ${bestNode.name}`);
            }
        } catch {
            await dlog(deploymentId, `Could not determine best build node, scheduling on any available node.`);
        }

        return { nodeSelector };
    }

    async deleteAllBuildsOfApp(appId: string) {
        const job名称Prefix = KubeObject名称Utils.toJob名称(appId);
        const jobs = await k3s.batch.list名称spacedJob(BUILD_NAMESPACE);
        const jobsOfBuild = jobs.body.items.filter((job) => job.metadata?.name?.startsWith(job名称Prefix));
        for (const job of jobsOfBuild) {
            await this.deleteBuild(job.metadata?.name!);
        }
    }

    async deleteAllFailedOrSuccededBuilds() {
        const jobs = await k3s.batch.list名称spacedJob(BUILD_NAMESPACE);
        const jobsTo删除 = jobs.body.items.filter((job) => {
            const status = this.getJob状态String(job.status);
            return status !== 'RUNNING' && status !== 'PENDING';
        });
        for (const job of jobsTo删除) {
            await this.deleteBuild(job.metadata?.name!);
        }
    }

    async deleteAllBuildsOfProject(projectId: string) {
        const jobs = await k3s.batch.list名称spacedJob(BUILD_NAMESPACE);
        const jobsOfProject = jobs.body.items.filter((job) => job.metadata?.annotations?.[Constants.QS_ANNOTATION_PROJECT_ID] === projectId);
        for (const job of jobsOfProject) {
            await this.deleteBuild(job.metadata?.name!);
        }
    }

    async getBuildBy名称(build名称: string) {
        const jobs = await k3s.batch.list名称spacedJob(BUILD_NAMESPACE);
        return jobs.body.items.find((job) => job.metadata?.name === build名称);
    }

    async getAppIdByBuild名称(build名称: string) {
        const job = await this.getBuildBy名称(build名称);
        if (!job) {
            throw new ServiceException(`No build found with name ${build名称}`);
        }
        const appId = job.metadata?.annotations?.[Constants.QS_ANNOTATION_APP_ID];
        if (!appId) {
            throw new ServiceException(`No appId found for build ${build名称}`);
        }
        return appId;
    }

    async deleteBuild(build名称: string) {
        const job = await this.getBuildBy名称(build名称);
        const gitSshSecret名称 = job?.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_SSH_SECRET];
        await k3s.batch.delete名称spacedJob(build名称, BUILD_NAMESPACE);
        await appGitSshKeyService.deleteTemporaryBuildSecret(gitSshSecret名称);
        console.log(`删除d build job ${build名称}`);
    }

    async getBuildsForApp(appId: string) {
        const job名称Prefix = KubeObject名称Utils.toJob名称(appId);
        const jobs = await k3s.batch.list名称spacedJob(BUILD_NAMESPACE);
        const jobsOfBuild = jobs.body.items.filter((job) => job.metadata?.name?.startsWith(job名称Prefix));
        const builds = jobsOfBuild.map((job) => ({
            name: job.metadata?.name,
            startTime: job.status?.startTime,
            status: this.getJob状态String(job.status),
            gitCommit: job.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_COMMIT],
            gitCommitMessage: job.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_COMMIT_MESSAGE],
            deploymentId: job.metadata?.annotations?.[Constants.QS_ANNOTATION_DEPLOYMENT_ID],
            buildMethod: job.metadata?.annotations?.[Constants.QS_ANNOTATION_BUILD_METHOD] as AppBuildMethod | undefined,
        } as BuildJobModel));
        builds.sort((a, b) => {
            if (a.startTime && b.startTime) {
                return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
            }
            return 0;
        });
        return builds;
    }

    async getJob状态(build名称: string): Promise<'UNKNOWN' | 'RUNNING' | 'FAILED' | 'SUCCEEDED' | 'PENDING'> {
        try {
            const response = await k3s.batch.read名称spacedJob状态(build名称, BUILD_NAMESPACE);
            return this.getJob状态String(response.body.status);
        } catch (err) {
            console.error(err);
        }
        return 'UNKNOWN';
    }

    getJob状态String(status?: V1Job状态) {
        if (!status) {
            return 'UNKNOWN';
        }
        if ((status.ready ?? 0) > 0) {
            return 'RUNNING';
        }
        if ((status.failed ?? 0) > 0) {
            return 'FAILED';
        }
        if ((status.succeeded ?? 0) > 0) {
            return 'SUCCEEDED';
        }
        if ((status.terminating ?? 0) > 0) {
            return 'UNKNOWN';
        }
        if (status.completionTime) {
            return 'SUCCEEDED';
        }
        if ((status.active ?? 0) > 0) {
            return 'PENDING';
        }
        return 'UNKNOWN';
    }

    async getAllBuilds(): Promise<GlobalBuildJobModel[]> {
        const jobs = await k3s.batch.list名称spacedJob(BUILD_NAMESPACE);
        const appIds = Array.from(new Set(
            jobs.body.items
                .map((job) => job.metadata?.annotations?.[Constants.QS_ANNOTATION_APP_ID])
                .filter((id): id is string => !!id)
        ));

        const apps = await dataAccess.client.app.findMany({
            where: { id: { in: appIds } },
            include: { project: true },
        });
        const appMap = new Map(apps.map((a) => [a.id, a]));

        return jobs.body.items
            .map((job) => {
                const appId = job.metadata?.annotations?.[Constants.QS_ANNOTATION_APP_ID];
                const projectId = job.metadata?.annotations?.[Constants.QS_ANNOTATION_PROJECT_ID];
                const app = appId ? appMap.get(appId) : undefined;
                return {
                    name: job.metadata?.name ?? '',
                    startTime: job.status?.startTime ?? new Date(0),
                    status: this.getJob状态String(job.status),
                    gitCommit: job.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_COMMIT] ?? '',
                    gitCommitMessage: job.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_COMMIT_MESSAGE],
                    deploymentId: job.metadata?.annotations?.[Constants.QS_ANNOTATION_DEPLOYMENT_ID] ?? '',
                    appId: appId ?? '',
                    projectId: projectId ?? '',
                    app名称: app?.name ?? appId ?? 'Unknown',
                    project名称: app?.project?.name ?? projectId ?? 'Unknown',
                    completionTime: job.status?.completionTime ?? undefined,
                    buildMethod: job.metadata?.annotations?.[Constants.QS_ANNOTATION_BUILD_METHOD] as AppBuildMethod | undefined,
                } as GlobalBuildJobModel;
            })
            .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }
}

const buildService = new BuildService();
export default buildService;
