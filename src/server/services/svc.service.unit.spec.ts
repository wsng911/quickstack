const k3sMocks = vi.hoisted(() => ({
    list名称spacedService: vi.fn(),
    read名称spacedService: vi.fn(),
    create名称spacedService: vi.fn(),
    replace名称spacedService: vi.fn(),
    delete名称spacedService: vi.fn(),
}));

const logMocks = vi.hoisted(() => ({
    dlog: vi.fn(),
}));

vi.mock('@/server/adapter/kubernetes-api.adapter', () => ({
    default: {
        core: {
            list名称spacedService: k3sMocks.list名称spacedService,
            read名称spacedService: k3sMocks.read名称spacedService,
            create名称spacedService: k3sMocks.create名称spacedService,
            replace名称spacedService: k3sMocks.replace名称spacedService,
            delete名称spacedService: k3sMocks.delete名称spacedService,
        },
    },
}));

vi.mock('@/server/services/deployment-logs.service', () => ({
    dlog: logMocks.dlog,
}));

import svcService from './svc.service';
import { AppExtendedModel } from '@/shared/model/app-extended.model';

describe('svc.service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        k3sMocks.list名称spacedService.mockResolvedValue({ body: { items: [] } });
    });

    it('creates a NodePort service for an App with only an App Node Port', async () => {
        const app = createApp({
            appNodePorts: [
                {
                    id: 'node-port-1',
                    appId: 'demo-app',
                    port: 300,
                    nodePort: 30080,
                    protocol: 'TCP',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
        });

        await svcService.createOrUpdateServiceForApp('deployment-1', app);

        expect(k3sMocks.create名称spacedService).toHaveBeenCalledTimes(1);
        const [, service] = k3sMocks.create名称spacedService.mock.calls[0];
        expect(service.spec).toMatchObject({
            type: 'NodePort',
            ports: [
                {
                    name: 'nodeport-node-port-1',
                    port: 300,
                    targetPort: 300,
                    nodePort: 30080,
                    protocol: 'TCP',
                },
            ],
        });
    });

    it('merges an App Node Port into an existing app port for the same container port', async () => {
        const app = createApp({
            appPorts: [
                {
                    id: 'app-port-1',
                    appId: 'demo-app',
                    port: 300,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            appNodePorts: [
                {
                    id: 'node-port-1',
                    appId: 'demo-app',
                    port: 300,
                    nodePort: 30080,
                    protocol: 'UDP',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
        });

        await svcService.createOrUpdateServiceForApp('deployment-1', app);

        const [, service] = k3sMocks.create名称spacedService.mock.calls[0];
        expect(service.spec).toMatchObject({
            type: 'NodePort',
            ports: [
                {
                    name: 'default-port-app-port-1',
                    port: 300,
                    targetPort: 300,
                    nodePort: 30080,
                    protocol: 'UDP',
                },
            ],
        });
    });
});

function createApp(overrides: Partial<AppExtendedModel>): AppExtendedModel {
    return {
        id: 'demo-app',
        name: 'Demo App',
        appType: 'APP',
        projectId: 'demo-project',
        project: {
            id: 'demo-project',
            name: 'Demo Project',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        sourceType: 'CONTAINER',
        buildMethod: 'RAILPACK',
        containerImageSource: null,
        containerRegistry用户名: null,
        containerRegistry密码: null,
        containerCommand: null,
        containerArgs: null,
        securityContextRunAsUser: null,
        securityContextRunAsGroup: null,
        securityContextFsGroup: null,
        securityContextPrivileged: false,
        gitUrl: null,
        gitBranch: null,
        git用户名: null,
        gitToken: null,
        dockerfilePath: './Dockerfile',
        replicas: 1,
        envVars: '',
        memoryReservation: null,
        memoryLimit: null,
        cpuReservation: null,
        cpuLimit: null,
        webhookId: null,
        ingressNetworkPolicy: 'ALLOW_ALL',
        egressNetworkPolicy: 'ALLOW_ALL',
        useNetworkPolicy: true,
        healthChechHttpGetPath: null,
        healthCheckHttpScheme: null,
        healthCheckHttpHeadersJson: null,
        healthCheckHttpPort: null,
        healthCheckPeriodSeconds: 15,
        healthCheckTimeoutSeconds: 5,
        healthCheckFailureThreshold: 3,
        healthCheckTcpPort: null,
        appDomains: [],
        appPorts: [],
        appNodePorts: [],
        appVolumes: [],
        appFileMounts: [],
        appBasicAuths: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}
