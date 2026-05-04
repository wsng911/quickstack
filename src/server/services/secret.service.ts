import { V1Secret } from "@kubernetes/client-node";
import k3s from "../adapter/kubernetes-api.adapter";
import { AppExtendedModel } from "@/shared/model/app-extended.model";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";

class SecretService {

    async createOrUpdateDockerPullSecret(app: AppExtendedModel) {
        if (this.appNeedsNoSecret(app)) {
            return;
        }
        const dockerImage = app.containerImageSource;
        const docker用户名 = app.containerRegistry用户名;
        const docker密码 = app.containerRegistry密码;

        const secret名称 = KubeObject名称Utils.toSecretId(app.id);
        const namespace = app.projectId;
        let dockerServer = dockerImage!.split("/")[0];

        // if no registry url is provided, use Docker Hub
        if (!dockerServer.includes('.')) {
            dockerServer = 'https://index.docker.io/v2/';
        }

        // 创建 a Docker registry secret
        const dockerConfigJson = {
            auths: {
                [dockerServer]: {
                    username: docker用户名,
                    password: docker密码,
                    //email: docker邮箱,
                    auth: Buffer.from(`${docker用户名}:${docker密码}`).toString('base64'),
                },
            },
        };

        const secretManifest: V1Secret = {
            metadata: {
                name: secret名称,
            },
            data: {
                '.dockerconfigjson': Buffer.from(JSON.stringify(dockerConfigJson)).toString('base64'),
            },
            type: 'kubernetes.io/dockerconfigjson',
        };

        await this.saveSecret(namespace, secret名称, secretManifest);
        return secret名称;
    }

    async delteUnusedSecrets(app: AppExtendedModel) {
        if (this.appNeedsNoSecret(app)) {
            const existingSecret = await this.getExistingSecret(app.projectId, KubeObject名称Utils.toSecretId(app.id));
            if (existingSecret) {
                console.log(`Deleting secret ${existingSecret.metadata?.name}...`);
                await this.deleteSecret(app.projectId, existingSecret.metadata?.name!);
            }
        }
    }

    private appNeedsNoSecret(app: { id: string; name: string; appType: string; projectId: string; sourceType: string; dockerfilePath: string; replicas: number; envVars: string; createdAt: Date; updatedAt: Date; project: { id: string; name: string; createdAt: Date; updatedAt: Date; }; appDomains: { id: string; createdAt: Date; updatedAt: Date; hostname: string; port: number; useSsl: boolean; redirectHttps: boolean; appId: string; }[]; appVolumes: { id: string; createdAt: Date; updatedAt: Date; appId: string; containerMountPath: string; size: number; accessMode: string; storageClass名称: string; }[]; appPorts: { id: string; createdAt: Date; updatedAt: Date; port: number; appId: string; }[]; appFileMounts: { id: string; createdAt: Date; updatedAt: Date; appId: string; containerMountPath: string; content: string; }[]; containerImageSource?: string | null | undefined; containerRegistry用户名?: string | null | undefined; containerRegistry密码?: string | null | undefined; gitUrl?: string | null | undefined; gitBranch?: string | null | undefined; git用户名?: string | null | undefined; gitToken?: string | null | undefined; memoryReservation?: number | null | undefined; memoryLimit?: number | null | undefined; cpuReservation?: number | null | undefined; cpuLimit?: number | null | undefined; }) {
        return app.sourceType === 'GIT' || app.sourceType === 'GIT_SSH' || !app.containerImageSource || !app.containerRegistry用户名 || !app.containerRegistry密码;
    }

    async createSecret(namespace: string, secretManifest: V1Secret) {
        const secret名称 = secretManifest.metadata?.name;
        if (!secret名称) {
            throw new Error('Secret name is required.');
        }
        console.log(`Creating secret ${secret名称}...`);
        await k3s.core.create名称spacedSecret(namespace, secretManifest);
    }

    async updateSecret(namespace: string, secret名称: string, secretManifest: V1Secret) {
        console.log(`Updating secret ${secret名称}...`);
        await k3s.core.replace名称spacedSecret(secret名称, namespace, secretManifest);
    }

    async saveSecret(namespace: string, secret名称: string, secretManifest: V1Secret) {
        const existingSecret = await this.getExistingSecret(namespace, secret名称);
        if (existingSecret) {
            await this.updateSecret(namespace, secret名称, secretManifest);
        } else {
            await this.createSecret(namespace, secretManifest);
        }
    }

    async deleteSecret(namespace: string, secret名称: string) {
        await k3s.core.delete名称spacedSecret(secret名称, namespace);
    }

    async deleteSecretIfExists(namespace: string, secret名称?: string) {
        if (!secret名称) {
            return;
        }
        const existingSecret = await this.getExistingSecret(namespace, secret名称);
        if (existingSecret) {
            console.log(`Deleting secret ${secret名称}...`);
            await this.deleteSecret(namespace, secret名称);
        }
    }

    async getExistingSecret(namespace: string, secret名称: string) {
        const existingSecrets = await k3s.core.list名称spacedSecret(namespace);
        const existingSecret = existingSecrets.body.items.find(s => s.metadata?.name === secret名称);
        return existingSecret;
    }
}

const secretService = new SecretService();
export default secretService;
