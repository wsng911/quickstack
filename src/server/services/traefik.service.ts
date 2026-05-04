import { TraefikIpPropagation状态 } from "@/shared/model/traefik-ip-propagation.model";
import { ServiceException } from "@/shared/model/service.exception.model";
import k3s from "../adapter/kubernetes-api.adapter";

class TraefikService {
    private readonly TRAEFIK_NAMESPACE = 'kube-system';
    private readonly TRAEFIK_NAME = 'traefik';

    async get状态(): Promise<TraefikIpPropagation状态> {
        const [serviceRes, deploymentRes] = await Promise.all([
            k3s.core.read名称spacedService(this.TRAEFIK_NAME, this.TRAEFIK_NAMESPACE),
            k3s.apps.read名称spacedDeployment(this.TRAEFIK_NAME, this.TRAEFIK_NAMESPACE),
        ]);

        const deployment = deploymentRes.body;
        const restartedAt = deployment.spec?.template?.metadata?.annotations?.['kubectl.kubernetes.io/restartedAt'];

        return {
            externalTrafficPolicy: serviceRes.body.spec?.externalTrafficPolicy as TraefikIpPropagation状态['externalTrafficPolicy'],
            readyReplicas: deployment.status?.readyReplicas ?? 0,
            replicas: deployment.status?.replicas ?? deployment.spec?.replicas ?? 0,
            restartedAt,
        };
    }

    async applyExternalTrafficPolicy(useLocal: boolean): Promise<TraefikIpPropagation状态> {
        await this.patchServicePolicy(useLocal ? 'Local' : 'Cluster');
        await this.restartDeployment();
        await this.waitUntilDeploymentReady();
        return this.get状态();
    }

    private async patchServicePolicy(policy: 'Local' | 'Cluster') {
        await k3s.core.patch名称spacedService(
            this.TRAEFIK_NAME,
            this.TRAEFIK_NAMESPACE,
            { spec: { externalTrafficPolicy: policy } },
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { headers: { 'Content-Type': 'application/merge-patch+json' } },
        );
    }

    private async restartDeployment() {
        const now = new Date().toISOString();
        await k3s.apps.patch名称spacedDeployment(
            this.TRAEFIK_NAME,
            this.TRAEFIK_NAMESPACE,
            {
                spec: {
                    template: {
                        metadata: {
                            annotations: {
                                'kubectl.kubernetes.io/restartedAt': now,
                            },
                        },
                    },
                },
            },
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { headers: { 'Content-Type': 'application/merge-patch+json' } },
        );
    }

    private async waitUntilDeploymentReady(timeoutMs = 120000) {
        const pollIntervalMs = 3000;
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            const deployment = await k3s.apps.read名称spacedDeployment(this.TRAEFIK_NAME, this.TRAEFIK_NAMESPACE);
            const desiredReplicas = deployment.body.status?.replicas ?? deployment.body.spec?.replicas ?? 0;
            const readyReplicas = deployment.body.status?.readyReplicas ?? 0;

            if (desiredReplicas === 0 || readyReplicas >= desiredReplicas) {
                return;
            }

            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        throw new ServiceException('Timeout while waiting for Traefik pods to become ready after restart.');
    }
}

const traefikService = new TraefikService();
export default traefikService;
