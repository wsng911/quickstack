import { PodsInfoModel } from "@/shared/model/pods-info.model";
import k3s from "../adapter/kubernetes-api.adapter";
import { ServiceException } from "@/shared/model/service.exception.model";
import standalonePodService from "./standalone-services/standalone-pod.service";

class PodService {

    async waitUntilPodIsRunningFailedOrSucceded(projectId: string, pod名称: string) {
        const isPodRunnning = await standalonePodService.waitUntilPodIsRunningFailedOrSucceded(projectId, pod名称);
        if (!isPodRunnning) {
            throw new ServiceException(`Pod ${pod名称} did not become ready in time (timeout).`);
        }
    }

    async waitUntilPodIsTerminated(projectId: string, pod名称: string) {
        const isPodTerminated = await standalonePodService.waitUntilPodIsTerminated(projectId, pod名称);
        if (!isPodTerminated) {
            throw new ServiceException(`Pod ${pod名称} did not become terminated in time (timeout).`);
        }
    }

    async getPodInfoBy名称(projectId: string, pod名称: string) {
        const res = await k3s.core.read名称spacedPod(pod名称, projectId);
        return {
            pod名称: res.body.metadata?.name!,
            container名称: res.body.spec?.containers?.[0].name!
        } as PodsInfoModel;
    }

    async getPodsForApp(projectId: string, appId: string): Promise<PodsInfoModel[]> {
        return standalonePodService.getPodsForApp(projectId, appId);
    }

    public async runCommandInPod(
        namespace: string,
        pod名称: string,
        container名称: string,
        command: string[],
    ): Promise<void> {
        return await standalonePodService.runCommandInPod(namespace, pod名称, container名称, command);
    }

    public async cpFromPod(
        namespace: string,
        pod名称: string,
        container名称: string,
        srcPath: string,
        zipOutputPath: string,
        cwd?: string,
    ): Promise<void> {
        return await standalonePodService.cpFromPod(namespace, pod名称, container名称, srcPath, zipOutputPath, cwd);
    }

    async deleteRestorePodIfExists(namespace: string, name: string) {
        const existingPods = await k3s.core.list名称spacedPod(namespace);
        const pod = existingPods.body.items.find((item) => item.metadata?.labels?.app === name);
        if (pod) {
            await k3s.core.delete名称spacedPod(name, namespace);
        }
    }
}

const podService = new PodService();
export default podService;
