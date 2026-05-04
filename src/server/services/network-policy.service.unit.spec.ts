const k3sMocks = vi.hoisted(() => ({
    list名称spacedNetworkPolicy: vi.fn(),
    create名称spacedNetworkPolicy: vi.fn(),
    replace名称spacedNetworkPolicy: vi.fn(),
    delete名称spacedNetworkPolicy: vi.fn(),
}));

vi.mock('@/server/adapter/kubernetes-api.adapter', () => ({
    default: {
        network: {
            list名称spacedNetworkPolicy: k3sMocks.list名称spacedNetworkPolicy,
            create名称spacedNetworkPolicy: k3sMocks.create名称spacedNetworkPolicy,
            replace名称spacedNetworkPolicy: k3sMocks.replace名称spacedNetworkPolicy,
            delete名称spacedNetworkPolicy: k3sMocks.delete名称spacedNetworkPolicy,
        },
    },
}));

import networkPolicyService from './network-policy.service';
import { AppExtendedModel } from '@/shared/model/app-extended.model';

describe('network-policy.service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        k3sMocks.list名称spacedNetworkPolicy.mockResolvedValue({ body: { items: [] } });
    });

    it('allows external ingress to configured App Node Ports', async () => {
        const app = {
            id: 'demo-app',
            projectId: 'demo-project',
            useNetworkPolicy: true,
            ingressNetworkPolicy: 'DENY_ALL',
            egressNetworkPolicy: 'DENY_ALL',
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
        } as AppExtendedModel;

        await networkPolicyService.reconcileNetworkPolicy(app);

        expect(k3sMocks.create名称spacedNetworkPolicy).toHaveBeenCalledTimes(1);
        const [, policy] = k3sMocks.create名称spacedNetworkPolicy.mock.calls[0];
        expect(policy.spec.ingress).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    from: [{ ipBlock: { cidr: '0.0.0.0/0' } }],
                    ports: [{ protocol: 'TCP', port: 300 }],
                }),
            ])
        );
    });
});
