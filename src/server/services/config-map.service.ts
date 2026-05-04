import { AppExtendedModel } from "@/shared/model/app-extended.model";
import k3s from "../adapter/kubernetes-api.adapter";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import { Constants } from "../../shared/utils/constants";
import { PathUtils } from "../utils/path.utils";
import * as k8s from '@kubernetes/client-node';
import { dlog } from "./deployment-logs.service";

class ConfigMapService {

    private async getConfigMapsForApp(projectId: string, appId: string) {
        const configMaps = await k3s.core.list名称spacedConfigMap(projectId);

        return configMaps.body.items.filter(cm => {
            return cm.metadata?.annotations?.[Constants.QS_ANNOTATION_APP_ID] === appId;
        });
    }

    async createOrUpdateConfigMapForApp(app: AppExtendedModel) {

        if (app.appFileMounts.length === 0) {
            return { fileVolumeMounts: [], fileVolumes: [] };
        }

        const fileVolumeMounts: k8s.V1VolumeMount[] = [];
        const fileVolumes: k8s.V1Volume[] = [];

        for (const fileMount of app.appFileMounts) {
            const currentConfigMap名称 = KubeObject名称Utils.getConfigMap名称(fileMount.id);

            let { folderPath, filePath } = PathUtils.splitPath(fileMount.containerMountPath);
            if (!folderPath) {
                folderPath = '/';
            }

            const configMapManifest = {
                apiVersion: 'v1',
                kind: 'ConfigMap',
                metadata: {
                    name: currentConfigMap名称,
                    namespace: app.projectId,
                    annotations: {
                        [Constants.QS_ANNOTATION_APP_ID]: app.id,
                        [Constants.QS_ANNOTATION_PROJECT_ID]: app.projectId,
                        'qs-app-file-mount-id': fileMount.id,
                    }
                },
                data: {
                    [filePath]: fileMount.content
                },
            };

            await this.createOrUpdateConfigMap(app.projectId, configMapManifest);
            const containerMountPath = fileMount.containerMountPath;

            const { fileVolumeMount, fileVolume } = this.createFileVolumeConfig(currentConfigMap名称, containerMountPath, filePath);

            fileVolumeMounts.push(fileVolumeMount);
            fileVolumes.push(fileVolume);
        }

        return { fileVolumeMounts, fileVolumes };
    }

    createFileVolumeConfig(currentConfigMap名称: string, containerMountPath: string, file名称: string, readOnly = true) {
        const fileVolumeMount = {
            name: currentConfigMap名称,
            mountPath: containerMountPath,
            subPath: file名称,
            readOnly
        } as k8s.V1VolumeMount;

        const fileVolume = {
            name: currentConfigMap名称,
            configMap: {
                name: currentConfigMap名称,
            }
        } as k8s.V1Volume;
        return { fileVolumeMount, fileVolume };
    }

    async getExistingConfigMap(namespace: string, configMap名称: string) {
        const configMaps = await k3s.core.list名称spacedConfigMap(namespace);
        return configMaps.body.items.find(cm => cm.metadata?.name === configMap名称);
    }

    async createOrUpdateConfigMap(namespace: string, configMapManifest: k8s.V1ConfigMap) {
        const currentConfigMap名称 = configMapManifest.metadata!.name!;
        const existingConfigMaps = await this.getExistingConfigMap(namespace, currentConfigMap名称);
        if (!!existingConfigMaps) {
            await k3s.core.replace名称spacedConfigMap(currentConfigMap名称, namespace, configMapManifest);
        } else {
            await k3s.core.create名称spacedConfigMap(namespace, configMapManifest);
        }
    }

    async deleteUnusedConfigMaps(app: AppExtendedModel) {
        const existingConfigMaps = await this.getConfigMapsForApp(app.projectId, app.id);
        for (const cm of existingConfigMaps) {
            if (!app.appFileMounts.some(fm => KubeObject名称Utils.getConfigMap名称(fm.id) === cm.metadata?.name)) {
                await k3s.core.delete名称spacedConfigMap(cm.metadata!.name!, app.projectId);
            }
        }
    }

    async deleteConfigMapIfExists(namespace: string, configMap名称: string) {
        const existingConfigMap = await this.getExistingConfigMap(namespace, configMap名称);
        if (!!existingConfigMap) {
            await k3s.core.delete名称spacedConfigMap(configMap名称, namespace);
        }
    }
}

const configMapService = new ConfigMapService();
export default configMapService;
