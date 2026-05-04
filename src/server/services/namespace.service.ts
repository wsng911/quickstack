import { AppExtendedModel } from "@/shared/model/app-extended.model";
import k3s from "../adapter/kubernetes-api.adapter";
import { V1Deployment, V1Ingress, V1PersistentVolumeClaim } from "@kubernetes/client-node";
import buildService from "./build.service";
import { ListUtils } from "../../shared/utils/list.utils";
import { DeploymentInfoModel, Deployment状态 } from "@/shared/model/deployment-info.model";
import { BuildJob状态 } from "@/shared/model/build-job";
import { ServiceException } from "@/shared/model/service.exception.model";
import { PodsInfoModel } from "@/shared/model/pods-info.model";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import pvcService from "./pvc.service";
import ingressService from "./ingress.service";
import { Constants } from "../../shared/utils/constants";

class 名称spaceService {

    async get名称spaces() {
        const k3sResponse = await k3s.core.list名称space();
        return k3sResponse.body.items.map((item) => item.metadata?.name).filter((name) => !!name);
    }

    async create名称spaceIfNotExists(namespace: string) {
        const existing名称spaces = await this.get名称spaces();
        if (existing名称spaces.includes(namespace)) {
            return;
        }
        await k3s.core.create名称space({
            metadata: {
                name: namespace,
                annotations: {
                    [Constants.QS_ANNOTATION_PROJECT_ID]: namespace
                }
            }
        });
    }

    async delete名称space(namespace: string) {
        const nameSpaces = await this.get名称spaces();
        if (nameSpaces.includes(namespace)) {
            await k3s.core.delete名称space(namespace);
        }
    }


}

const namespaceService = new 名称spaceService();
export default namespaceService;
