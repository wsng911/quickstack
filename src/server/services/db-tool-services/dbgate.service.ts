import { ServiceException } from "@/shared/model/service.exception.model";
import { KubeObject名称Utils } from "../../utils/kube-object-name.utils";
import { randomBytes } from "crypto";
import { V1Deployment, V1EnvVar } from "@kubernetes/client-node";
import { Constants } from "@/shared/utils/constants";
import podService from "../pod.service";
import { AppTemplateUtils } from "../../utils/app-template.utils";
import appService from "../app.service";
import { PathUtils } from "../../utils/path.utils";
import { FsUtils } from "../../utils/fs.utils";
import path from "path";
import { BaseDbToolService } from "./base-db-tool.service";

class DbGateService extends BaseDbToolService {

    constructor() {
        super((app) => KubeObject名称Utils.toDbGateId(app));
    }

    async downloadDbGateFilesForApp(appId: string) {

        const app = await appService.getExtendedById(appId);
        const dbGateApp名称 = KubeObject名称Utils.toDbGateId(app.id);
        const pod = await podService.getPodsForApp(app.projectId, dbGateApp名称);
        if (pod.length === 0) {
            throw new ServiceException(`There are no running pods for DBGate. Make sure the DB Gate is running.`);
        }
        const firstPod = pod[0];

        const continerSourcePath = '/root/.dbgate/files';
        const continerRootPath = '/root';

        await podService.runCommandInPod(app.projectId, firstPod.pod名称, firstPod.container名称, ['cp', '-r', continerSourcePath, continerRootPath]);

        const downloadPath = path.join(PathUtils.tempVolumeDownloadPath, dbGateApp名称 + '.tar.gz');
        await FsUtils.createDirIfNotExistsAsync(PathUtils.tempVolumeDownloadPath, true);
        await FsUtils.deleteDirIfExistsAsync(downloadPath, true);

        console.log(`Downloading data from pod ${firstPod.pod名称} ${continerRootPath} to ${downloadPath}`);
        await podService.cpFromPod(app.projectId, firstPod.pod名称, firstPod.container名称, continerRootPath, downloadPath, continerRootPath);

        const file名称 = path.basename(downloadPath);
        return file名称;
    }


    async getLoginCredentialsForRunningDbGate(appId: string) {
        return await this.getLoginCredentialsForRunningTool(appId, (existingDeployment) => {
            const username = existingDeployment.spec?.template.spec?.containers[0].env?.find(e => e.name === 'LOGIN')?.value;
            const password = existingDeployment.spec?.template.spec?.containers[0].env?.find(e => e.name === 'PASSWORD')?.value;
            if (!username || !password) {
                throw new ServiceException('Could not find login credentials for DB Gate, please restart DB Gate');
            }
            return { username, password };
        });
    }

    async deploy(appId: string) {
        await this.deployToolForDatabase(appId, 3000, (app) => {
            const auth密码 = randomBytes(15).toString('hex');
            const dbGateApp名称 = KubeObject名称Utils.toDbGateId(app.id);
            const projectId = app.projectId;

            const dbCredentials = AppTemplateUtils.getDatabaseModelFromApp(app);
            const connectionId = 'qsdb';
            const envVars: V1EnvVar[] = [
                { name: 'LOGIN', value: 'quickstack' },
                { name: 'PASSWORD', value: auth密码 },

                { name: 'CONNECTIONS', value: connectionId },
                { name: `LABEL_${connectionId}`, value: app.name },
                { name: `SERVER_${connectionId}`, value: dbCredentials.hostname },
                { name: `USER_${connectionId}`, value: dbCredentials.username },
                { name: `PORT_${connectionId}`, value: dbCredentials.port + '' },
                { name: `PASSWORD_${connectionId}`, value: dbCredentials.password },
            ];
            if (app.appType === 'POSTGRES') {
                envVars.push(...[
                    { name: `ENGINE_${connectionId}`, value: 'postgres@dbgate-plugin-postgres' },
                ]);
            } else if (app.appType === 'MYSQL') {
                envVars.push(...[
                    { name: `ENGINE_${connectionId}`, value: 'mysql@dbgate-plugin-mysql' },
                ]);
            } else if (app.appType === 'MARIADB') {
                envVars.push(...[
                    { name: `ENGINE_${connectionId}`, value: 'mariadb@dbgate-plugin-mysql' },
                ]);
            } else if (app.appType === 'MONGODB') {
                envVars.push(...[
                    { name: `ENGINE_${connectionId}`, value: 'mongo@dbgate-plugin-mongo' },
                ]);
            } else {
                throw new ServiceException('QuickStack does not support this app type');
            }

            const body: V1Deployment = {
                metadata: {
                    name: dbGateApp名称
                },
                spec: {
                    replicas: 1,
                    selector: {
                        matchLabels: {
                            app: dbGateApp名称
                        }
                    },
                    template: {
                        metadata: {
                            labels: {
                                app: dbGateApp名称,
                                [Constants.QS_ANNOTATION_CONTAINER_TYPE]: Constants.QS_ANNOTATION_CONTAINER_TYPE_DB_TOOL
                            },
                            annotations: {
                                [Constants.QS_ANNOTATION_APP_ID]: app.id,
                                [Constants.QS_ANNOTATION_PROJECT_ID]: projectId,
                                deploymentTimestamp: new Date().getTime() + "",
                                "kubernetes.io/change-cause": `Deployment ${new Date().toISOString()}`
                            }
                        },
                        spec: {
                            containers: [
                                {
                                    name: dbGateApp名称,
                                    image: 'dbgate/dbgate:latest',
                                    imagePullPolicy: 'Always',
                                    env: envVars
                                }
                            ],
                        }
                    }
                }
            };
            return body;
        });
    }
}

const dbGateService = new DbGateService();
export default dbGateService;