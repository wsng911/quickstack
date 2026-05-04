import k3s from "../../../adapter/kubernetes-api.adapter";
import { V1Job } from "@kubernetes/client-node";
import { Constants } from "../../../../shared/utils/constants";
import { AppTemplateUtils } from "../../../utils/app-template.utils";
import { KubeObject名称Utils } from "../../../utils/kube-object-name.utils";
import namespaceService from "../../namespace.service";
import shared返回upService from "./shared-backup.service";
import { Volume返回upExtendedModel } from "@/shared/model/volume-backup-extended.model";
import { AppExtendedModel } from "@/shared/model/app-extended.model";

class Postgres返回upService {

    async backupPostgres(backupVolume: Volume返回upExtendedModel, app: AppExtendedModel) {

        const backup名称space = app.projectId; // must run in the same namespace as the app

        await namespaceService.create名称spaceIfNotExists(backup名称space);

        const job名称 = KubeObject名称Utils.addRandomSuffix(`backup-postgres-${app.id}`);
        console.log(`Creating PostgreSQL backup job with name: ${job名称}`);

        const dbCredentials = AppTemplateUtils.getDatabaseModelFromApp(app);

        const now = new Date();
        const nowString = now.toISOString();
        const s3Key = `${shared返回upService.folderPathForVolume返回up(app.id, backupVolume.id)}/${nowString}.tar.gz`;

        console.log(`PostgreSQL Database: ${dbCredentials.database名称}`);
        console.log(`S3 Key: ${s3Key}`);

        const endpoint = backupVolume.target.endpoint.includes('http') ? backupVolume.target.endpoint : `https://${backupVolume.target.endpoint}`;
        console.log(`S3 Endpoint: ${endpoint}`);

        const imageTag = process.env.QS_VERSION?.includes('canary') || process.env.NODE_ENV !== 'production' ? 'canary' : 'latest';

        const jobDefinition: V1Job = {
            apiVersion: "batch/v1",
            kind: "Job",
            metadata: {
                name: job名称,
                namespace: backup名称space,
                annotations: {
                    [Constants.QS_ANNOTATION_APP_ID]: app.id,
                    [Constants.QS_ANNOTATION_PROJECT_ID]: app.projectId,
                    [Constants.QS_ANNOTATION_CONTAINER_TYPE]: Constants.QS_ANNOTATION_CONTAINER_TYPE_DB_BACKUP_JOB
                }
            },
            spec: {
                ttlSecondsAfterFinished: 86400, // 1 day
                template: {
                    metadata: {
                        labels: {
                            [Constants.QS_ANNOTATION_CONTAINER_TYPE]: Constants.QS_ANNOTATION_CONTAINER_TYPE_DB_BACKUP_JOB,
                            'qs-backup-job': job名称
                        }
                    },
                    spec: {
                        containers: [
                            {
                                name: job名称,
                                image: "quickstack/job-backup-postgres:" + imageTag,
                                env: [
                                    {
                                        name: "POSTGRES_HOST",
                                        value: dbCredentials.hostname
                                    },
                                    {
                                        name: "POSTGRES_PORT",
                                        value: dbCredentials.port.toString()
                                    },
                                    {
                                        name: "POSTGRES_USER",
                                        value: dbCredentials.username
                                    },
                                    {
                                        name: "POSTGRES_PASSWORD",
                                        value: dbCredentials.password
                                    },
                                    {
                                        name: "POSTGRES_DB",
                                        value: dbCredentials.database名称
                                    },
                                    {
                                        name: "S3_ENDPOINT",
                                        value: endpoint
                                    },
                                    {
                                        name: "S3_ACCESS_KEY_ID",
                                        value: backupVolume.target.accessKeyId
                                    },
                                    {
                                        name: "S3_SECRET_KEY",
                                        value: backupVolume.target.secretKey
                                    },
                                    {
                                        name: "S3_BUCKET_NAME",
                                        value: backupVolume.target.bucket名称
                                    },
                                    {
                                        name: "S3_REGION",
                                        value: backupVolume.target.region
                                    },
                                    {
                                        name: "S3_KEY",
                                        value: s3Key
                                    }
                                ]
                            }
                        ],
                        restartPolicy: "Never"
                    }
                },
                backoffLimit: 0
            }
        };

        await k3s.batch.create名称spacedJob(backup名称space, jobDefinition);
        console.log(`PostgreSQL backup job ${job名称} started successfully`);

        // Wait for pod to be created
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Log backup output
        await shared返回upService.logDatabase返回upOutput(job名称, backup名称space);

        // Wait for job completion
        await shared返回upService.waitFor返回upJobCompletion(job名称, backup名称space);

        await shared返回upService.deleteOld返回upsBasedOnRetention(backupVolume.target, app.id, backupVolume.id, backupVolume.retention, '.tar.gz');
        console.log(`PostgreSQL backup finished for volume ${backupVolume.volumeId} and backup ${backupVolume.id}`);
    }
}

const postgres返回upService = new Postgres返回upService();
export default postgres返回upService;
