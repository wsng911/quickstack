import * as k8s from '@kubernetes/client-node';
import { V1Job } from '@kubernetes/client-node';
import { Constants } from '../../../shared/utils/constants';
import k3s from '../../adapter/kubernetes-api.adapter';
import buildService from '../build.service';
import deploymentService from '../deployment.service';
import appService from '../app.service';
import { dlog } from '../deployment-logs.service';
import { BUILD_NAMESPACE } from '../registry.service';
import { AppBuildMethod } from '@/shared/model/app-source-info.model';
import appGitSshKeyService from '../app-git-ssh-key.service';

declare global {
    var buildWatchServiceInstance: BuildWatchService | undefined;
}

class BuildWatchService {
    private isWatchRunning = false;
    private processedJobs = new Set<string>();

    async startWatch() {
        if (this.isWatchRunning) {
            console.log('[BuildWatch] Watch already running, skipping start.');
            return;
        }
        this.isWatchRunning = true;
        console.log('[BuildWatch] Starting build job watch...');

        await this.scanExistingJobs();

        const kc = k3s.getKubeConfig();
        const watch = new k8s.Watch(kc);

        await watch.watch(
            `/apis/batch/v1/namespaces/${BUILD_NAMESPACE}/jobs`,
            {},
            async (type: string, apiObj: unknown) => {
                try {
                    const job = apiObj as V1Job;
                    await this.handleJobEvent(job);
                } catch (e) {
                    console.error('[BuildWatch] Error handling job event:', e);
                }
            },
            (err: unknown) => {
                if (err) console.error('[BuildWatch] Watch error:', err);
                console.log('[BuildWatch] Watch ended, restarting in 5s...');
                this.isWatchRunning = false;
                setTimeout(() => this.startWatch(), 5000);
            }
        );
    }

    private async scanExistingJobs() {
        console.log('[BuildWatch] Scanning existing build jobs...');
        try {
            const jobs = await k3s.batch.list名称spacedJob(BUILD_NAMESPACE);
            for (const job of jobs.body.items) {
                const job名称 = job.metadata?.name;
                if (!job名称) continue;

                const status = buildService.getJob状态String(job.status);

                if (status === 'FAILED') {
                    // Mark as processed so watch won't re-handle it
                    this.processedJobs.add(job名称);
                    continue;
                }

                if (status === 'SUCCEEDED') {
                    // Check if deployment already reflects this build via git commit comparison
                    const appId = job.metadata?.annotations?.[Constants.QS_ANNOTATION_APP_ID];
                    const projectId = job.metadata?.annotations?.[Constants.QS_ANNOTATION_PROJECT_ID];
                    const jobGitCommit = job.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_COMMIT];

                    if (!appId || !projectId) {
                        this.processedJobs.add(job名称);
                        continue;
                    }

                    try {
                        const deployment = await deploymentService.getDeployment(projectId, appId);
                        const deployedGitCommit = deployment?.spec?.template?.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_COMMIT];

                        if (jobGitCommit && deployedGitCommit && jobGitCommit === deployedGitCommit) {
                            // Already deployed with this commit
                            this.processedJobs.add(job名称);
                            console.log(`[BuildWatch] Job ${job名称} already deployed (commit=${jobGitCommit}), skipping.`);
                        } else {
                            // Not yet deployed — trigger deployment
                            this.processedJobs.add(job名称);
                            console.log(`[BuildWatch] Job ${job名称} not yet deployed, triggering deployment.`);
                            await this.handleSucceeded(job);
                        }
                    } catch (e) {
                        console.error(`[BuildWatch] Error checking deployment for app ${appId}:`, e);
                        this.processedJobs.add(job名称);
                    }
                }
            }
        } catch (e) {
            console.error('[BuildWatch] Error during startup scan:', e);
        }
        console.log('[BuildWatch] Startup scan complete.');
    }

    private async handleJobEvent(job: V1Job) {
        const job名称 = job.metadata?.name;
        if (!job名称 || this.processedJobs.has(job名称)) return;

        const status = buildService.getJob状态String(job.status);

        if (status === 'SUCCEEDED') {
            this.processedJobs.add(job名称);
            await this.handleSucceeded(job);
        } else if (status === 'FAILED') {
            this.processedJobs.add(job名称);
            await this.handleFailed(job);
        }
    }

    private async handleSucceeded(job: V1Job) {
        const deploymentId = job.metadata?.annotations?.[Constants.QS_ANNOTATION_DEPLOYMENT_ID];
        const appId = job.metadata?.annotations?.[Constants.QS_ANNOTATION_APP_ID];
        const gitCommitHash = job.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_COMMIT];
        const gitCommitMessage = job.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_COMMIT_MESSAGE];
        const buildJob名称 = job.metadata?.name;
        const buildMethod = job.metadata?.annotations?.[Constants.QS_ANNOTATION_BUILD_METHOD] as AppBuildMethod | undefined;
        const gitSshSecret名称 = job.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_SSH_SECRET];

        if (!deploymentId || !appId || !buildJob名称) {
            console.error('[BuildWatch] handleSucceeded: missing required annotations on job', job.metadata?.name);
            return;
        }

        try {
            console.log(`[BuildWatch] Build job ${buildJob名称} succeeded, triggering deployment for app ${appId}`);
            await dlog(deploymentId, `*************************************`);
            await dlog(deploymentId, ` ✓ Build job completed successfully. `);
            await dlog(deploymentId, `*************************************`);
            await dlog(deploymentId, `Starting deployment with output from build "${buildJob名称}"`);
            const app = await appService.getExtendedById(appId, false);
            await deploymentService.createDeployment(
                deploymentId,
                app,
                buildJob名称,
                gitCommitHash,
                gitCommitMessage,
                buildMethod ?? (app.buildMethod === 'DOCKERFILE' ? 'DOCKERFILE' : 'RAILPACK'),
            );
        } catch (e) {
            console.error(`[BuildWatch] Error triggering deployment for app ${appId}:`, e);
            if (deploymentId) {
                await dlog(deploymentId, `[ERROR] Deployment failed after build: ${e}`);
            }
        } finally {
            await appGitSshKeyService.deleteTemporaryBuildSecret(gitSshSecret名称);
        }
    }

    private async handleFailed(job: V1Job) {
        const deploymentId = job.metadata?.annotations?.[Constants.QS_ANNOTATION_DEPLOYMENT_ID];
        const buildJob名称 = job.metadata?.name;
        const gitSshSecret名称 = job.metadata?.annotations?.[Constants.QS_ANNOTATION_GIT_SSH_SECRET];
        if (!deploymentId) {
            await appGitSshKeyService.deleteTemporaryBuildSecret(gitSshSecret名称);
            return;
        }

        console.log(`[BuildWatch] Build job ${buildJob名称} failed, logging error.`);
        await dlog(deploymentId, `*********************`);
        await dlog(deploymentId, ` ⚠ Build job failed. `);
        await dlog(deploymentId, `*********************`);
        await appGitSshKeyService.deleteTemporaryBuildSecret(gitSshSecret名称);
    }
}

const buildWatchService = globalThis.buildWatchServiceInstance ?? new BuildWatchService();
globalThis.buildWatchServiceInstance = buildWatchService;
export default buildWatchService;
