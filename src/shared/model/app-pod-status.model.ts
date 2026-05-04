import { Deployment状态 } from "./deployment-info.model";

export interface AppPods状态Model {
    appId: string;
    app名称: string;
    projectId: string;
    project名称: string;
    replicas?: number;
    readyReplicas?: number;
    deployment状态: Deployment状态;
}
