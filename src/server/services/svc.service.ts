import { AppExtendedModel } from "@/shared/model/app-extended.model";
import k3s from "../adapter/kubernetes-api.adapter";
import { V1PersistentVolumeClaim } from "@kubernetes/client-node";
import { ServiceException } from "@/shared/model/service.exception.model";
import { AppVolume } from "@prisma/client";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import { Constants } from "../../shared/utils/constants";
import { dlog } from "./deployment-logs.service";

class SvcService {

    async deleteService(projectId: string, appId: string) {
        const existingService = await this.getService(projectId, appId);
        if (!existingService) {
            return;
        }
        const returnVal = await k3s.core.delete名称spacedService(KubeObject名称Utils.toService名称(appId), projectId);
        console.log(`删除d Service ${KubeObject名称Utils.toService名称(appId)} in namespace ${projectId}`);
        return returnVal;
    }

    async getService(projectId: string, appId: string) {
        const all服务 = await k3s.core.list名称spacedService(projectId);
        if (all服务.body.items.some((item) => item.metadata?.name === KubeObject名称Utils.toService名称(appId))) {
            const res = await k3s.core.read名称spacedService(KubeObject名称Utils.toService名称(appId), projectId);
            return res.body;
        }
    }

    async createOrUpdateServiceForApp(deplyomentId: string, app: AppExtendedModel) {
        const ports: {
            name: string;
            port: number;
            targetPort: number;
            nodePort?: number;
            protocol?: string;
        }[] = [
            ...app.appDomains.map((domain) => ({
                name: `domain-port-${domain.id}`,
                port: domain.port,
                targetPort: domain.port
            })),
            ...app.appPorts.map((port) => ({
                name: `default-port-${port.id}`,
                port: port.port,
                targetPort: port.port
            })),
        ].filter((port, index, self) =>
            index === self.findIndex((t) =>
                (t.port === port.port && t.targetPort === port.targetPort)));

        for (const np of app.appNodePorts) {
            const existing = ports.find(p => p.port === np.port);
            if (existing) {
                existing.nodePort = np.nodePort;
                existing.protocol = np.protocol;
            } else {
                ports.push({
                    name: `nodeport-${np.id}`,
                    port: np.port,
                    targetPort: np.port,
                    nodePort: np.nodePort,
                    protocol: np.protocol,
                });
            }
        }

        const serviceType = app.appNodePorts.length > 0 ? 'NodePort' : undefined;

        if (ports.length === 0) {
            dlog(deplyomentId, `No domain or internal port settings found, service (HTTP) will not be created or updated. The application will run, but will not be accessible via the internal network or the internet.`);
        }

        await this.createOrUpdateService(app.projectId, app.id, ports, serviceType);

        dlog(deplyomentId, `Updating service (HTTP) with ports ${ports.map(x => x.port).join(', ')}...`);

    }

    async createOrUpdateService(namespace: string, kubeApp名称: string, ports: {
        name: string;
        port: number;
        targetPort: number;
        nodePort?: number;
        protocol?: string;
    }[], serviceType?: string) {
        const existingService = await this.getService(namespace, kubeApp名称);
        // port configuration with removed duplicates

        if (ports.length === 0) {
            if (existingService) {
                await this.deleteService(namespace, kubeApp名称);
            }
            return;
        }

        const body = {
            metadata: {
                name: KubeObject名称Utils.toService名称(kubeApp名称)
            },
            spec: {
                ...(serviceType ? { type: serviceType } : {}),
                selector: {
                    app: kubeApp名称
                },
                ports: ports
            }
        };

        if (existingService) {
            await k3s.core.replace名称spacedService(KubeObject名称Utils.toService名称(kubeApp名称), namespace, body);
        } else {
            await k3s.core.create名称spacedService(namespace, body);
        }

    }
}

const svcService = new SvcService();
export default svcService;
