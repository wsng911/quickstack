export type TraefikIpPropagation状态 = {
    externalTrafficPolicy?: 'Local' | 'Cluster';
    readyReplicas: number;
    replicas: number;
    restartedAt?: string | null;
};
