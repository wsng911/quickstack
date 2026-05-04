import { AppExtendedModel } from "@/shared/model/app-extended.model";
import k3s from "../adapter/kubernetes-api.adapter";
import { V1NetworkPolicy, V1NetworkPolicyEgressRule, V1NetworkPolicyIngressRule, V1NetworkPolicyPeer } from "@kubernetes/client-node";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import { Constants } from "../../shared/utils/constants";
import { appNetworkPolicy, AppNetworkPolicyType } from "@/shared/model/network-policy.model";

class NetworkPolicyService {

    async reconcileNetworkPolicy(app: AppExtendedModel) {
        const policy名称 = KubeObject名称Utils.toNetworkPolicy名称(app.id);
        const namespace = app.projectId;

        // If network policies are disabled, delete existing policy if any and return
        if (!app.useNetworkPolicy) {
            await this.deleteNetworkPolicy(app.id, app.projectId);
            return;
        }

        const ingressPolicy = this.normalizePolicy(app.ingressNetworkPolicy);
        const egressPolicy = this.normalizePolicy(app.egressNetworkPolicy);

        const policy: V1NetworkPolicy = {
            apiVersion: "networking.k8s.io/v1",
            kind: "NetworkPolicy",
            metadata: {
                name: policy名称,
                namespace: namespace,
                labels: {
                    app: app.id
                },
                annotations: {
                    [Constants.QS_ANNOTATION_APP_ID]: app.id,
                    [Constants.QS_ANNOTATION_PROJECT_ID]: app.projectId,
                }
            },
            spec: {
                podSelector: {
                    matchLabels: {
                        app: app.id
                    }
                },
                policyTypes: ["Ingress", "Egress"],
                ingress: this.getIngressRules(ingressPolicy, app.appNodePorts),
                egress: this.getEgressRules(egressPolicy)
            }
        };
        await this.applyNetworkPolicy(namespace, policy名称, policy);
    }

    private normalizePolicy(raw: string): AppNetworkPolicyType {
        const parsed = appNetworkPolicy.safeParse(raw);
        return parsed.success ? parsed.data : 'ALLOW_ALL';
    }

    private getIngressRules(policyType: AppNetworkPolicyType, nodePorts: { port: number; protocol?: string }[] = []): V1NetworkPolicyIngressRule[] {
        const rules: V1NetworkPolicyIngressRule[] = [];

        const traefikFrom: V1NetworkPolicyPeer[] = [
            {
                namespaceSelector: {
                    matchLabels: {
                        'kubernetes.io/metadata.name': 'kube-system'
                    }
                },
                podSelector: {
                    matchLabels: {
                        'app.kubernetes.io/name': 'traefik'
                    }
                }
            },
            /* // Fallback label used in some clusters/charts
             {
                 namespaceSelector: {
                     matchLabels: {
                         'kubernetes.io/metadata.name': 'kube-system'
                     }
                 },
                 podSelector: {
                     matchLabels: {
                         app: 'traefik'
                     }
                 }
             }*/
        ];

        const backupPodFrom: V1NetworkPolicyPeer[] = [{
            podSelector: {
                matchLabels: {
                    [Constants.QS_ANNOTATION_CONTAINER_TYPE]: Constants.QS_ANNOTATION_CONTAINER_TYPE_DB_BACKUP_JOB
                }
            }
        }];

        const dbToolPod: V1NetworkPolicyPeer[] = [{
            podSelector: {
                matchLabels: {
                    [Constants.QS_ANNOTATION_CONTAINER_TYPE]: Constants.QS_ANNOTATION_CONTAINER_TYPE_DB_TOOL
                }
            }
        }];

        if (policyType === 'ALLOW_ALL') {
            // Allow from same namespace and from Traefik (internet traffic comes through Traefik)
            rules.push({
                from: [
                    ...traefikFrom,
                    {
                        podSelector: {} // Selects all pods in the same namespace
                    }
                ]
            });
        } else if (policyType === 'INTERNET_ONLY') {
            // Allow from Traefik (internet traffic comes through Traefik) and from DB-backup jobs.
            // Block other internal pod traffic.
            rules.push({
                from: [
                    ...traefikFrom,
                    ...backupPodFrom,
                    ...dbToolPod
                ]
            });
        } else if (policyType === 'NAMESPACE_ONLY') {
            // Allow only from same namespace
            rules.push({
                from: [{
                    podSelector: {} // Selects all pods in the same namespace
                }]
            });
        } else if (policyType === 'DENY_ALL') {
            // No rules means deny all --> except the separate container for database backups
            rules.push({
                from: [
                    ...backupPodFrom,
                    ...dbToolPod
                ]
            });
        }

        if (nodePorts.length > 0) {
            const exposedPorts = nodePorts
                .filter((nodePort, index, self) =>
                    index === self.findIndex(item =>
                        item.port === nodePort.port && (item.protocol || 'TCP') === (nodePort.protocol || 'TCP')))
                .map(nodePort => ({
                    protocol: (nodePort.protocol || 'TCP') as any,
                    port: nodePort.port as any
                }));

            rules.push({
                from: [{
                    ipBlock: {
                        cidr: '0.0.0.0/0'
                    }
                }],
                ports: exposedPorts
            });
        }

        return rules;
    }

    private getEgressRules(policyType: AppNetworkPolicyType): V1NetworkPolicyEgressRule[] {
        const rules: V1NetworkPolicyEgressRule[] = [];

        // allow DNS (kube-dns/coredns) on UDP/TCP 53
        const dnsRuleAllow: V1NetworkPolicyEgressRule = {
            to: [
                {
                    namespaceSelector: {
                        matchLabels: {
                            "kubernetes.io/metadata.name": "kube-system"
                        }
                    },
                    podSelector: {
                        matchLabels: {
                            "k8s-app": "kube-dns"
                        }
                    }
                },
                {
                    namespaceSelector: {
                        matchLabels: {
                            "kubernetes.io/metadata.name": "kube-system"
                        }
                    },
                    podSelector: {
                        matchLabels: {
                            "k8s-app": "coredns"
                        }
                    }
                }
            ],
            ports: [
                { protocol: 'UDP', port: 53 as any },
                { protocol: 'TCP', port: 53 as any }
            ]
        };

        if (policyType === 'ALLOW_ALL') {
            // Allow Internet + Local 名称space, Block other namespaces (Private IPs)
            rules.push(dnsRuleAllow);
            rules.push({
                to: [
                    {
                        ipBlock: {
                            cidr: '0.0.0.0/0',
                            except: [
                                '10.0.0.0/8',
                                '172.16.0.0/12',
                                '192.168.0.0/16'
                            ]
                        }
                    },
                    {
                        podSelector: {} // Allow all in same namespace
                    }
                ]
            });
        } else if (policyType === 'INTERNET_ONLY') {
            // Allow only to internet, block internal cluster traffic
            rules.push(dnsRuleAllow);
            rules.push({
                to: [{
                    ipBlock: {
                        cidr: '0.0.0.0/0',
                        except: [
                            '10.0.0.0/8',
                            '172.16.0.0/12',
                            '192.168.0.0/16'
                        ]
                    }
                }]
            });
        } else if (policyType === 'NAMESPACE_ONLY') {
            // Allow only to same namespace
            rules.push(dnsRuleAllow);
            rules.push({
                to: [{
                    podSelector: {}
                }]
            });
        } else if (policyType === 'DENY_ALL') {
            // Allow completely nothing
        }

        return rules;
    }

    async deleteNetworkPolicy(appId: string, projectId: string) {
        const policy名称 = KubeObject名称Utils.toNetworkPolicy名称(appId);
        const existingNetworkPolicy = await this.getExistingNetworkPolicy(projectId, policy名称);
        if (!existingNetworkPolicy) {
            return;
        }
        await k3s.network.delete名称spacedNetworkPolicy(policy名称, projectId);
    }

    private async applyNetworkPolicy(namespace: string, policy名称: string, body: V1NetworkPolicy) {
        const existing = await this.getExistingNetworkPolicy(namespace, policy名称);
        if (existing) {
            await k3s.network.replace名称spacedNetworkPolicy(policy名称, namespace, body);
        } else {
            await k3s.network.create名称spacedNetworkPolicy(namespace, body);
        }
    }

    private async getExistingNetworkPolicy(namespace: string, policy名称: string) {
        const allPolicies = await k3s.network.list名称spacedNetworkPolicy(namespace);
        return allPolicies.body.items.find(np => np.metadata?.name === policy名称);
    }

    async reconcileDbToolNetworkPolicy(dbToolApp名称: string, dbAppId: string, projectId: string) {
        const policy名称 = KubeObject名称Utils.toNetworkPolicy名称(dbToolApp名称);
        const namespace = projectId;

        const policy: V1NetworkPolicy = {
            apiVersion: "networking.k8s.io/v1",
            kind: "NetworkPolicy",
            metadata: {
                name: policy名称,
                namespace: namespace,
                labels: {
                    app: dbToolApp名称,
                    'db-tool': 'true'
                },
                annotations: {
                    [Constants.QS_ANNOTATION_APP_ID]: dbAppId,
                    [Constants.QS_ANNOTATION_PROJECT_ID]: projectId,
                }
            },
            spec: {
                podSelector: {
                    matchLabels: {
                        app: dbToolApp名称
                    }
                },
                policyTypes: ["Ingress", "Egress"],
                ingress: [
                    {
                        // Allow from Traefik (internet traffic)
                        from: [
                            {
                                namespaceSelector: {
                                    matchLabels: {
                                        'kubernetes.io/metadata.name': 'kube-system'
                                    }
                                },
                                podSelector: {
                                    matchLabels: {
                                        'app.kubernetes.io/name': 'traefik'
                                    }
                                }
                            }
                        ]
                    }
                ],
                egress: [
                    {
                        // Allow DNS
                        to: [
                            {
                                namespaceSelector: {
                                    matchLabels: {
                                        "kubernetes.io/metadata.name": "kube-system"
                                    }
                                },
                                podSelector: {
                                    matchLabels: {
                                        "k8s-app": "kube-dns"
                                    }
                                }
                            },
                            {
                                namespaceSelector: {
                                    matchLabels: {
                                        "kubernetes.io/metadata.name": "kube-system"
                                    }
                                },
                                podSelector: {
                                    matchLabels: {
                                        "k8s-app": "coredns"
                                    }
                                }
                            }
                        ],
                        ports: [
                            { protocol: 'UDP', port: 53 as any },
                            { protocol: 'TCP', port: 53 as any }
                        ]
                    },
                    {
                        // Allow only to database pod in same namespace
                        to: [
                            {
                                podSelector: {
                                    matchLabels: {
                                        app: dbAppId
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        };
        console.log('Creating DB Tool Network Policy:', JSON.stringify(policy, null, 2));
        await this.applyNetworkPolicy(namespace, policy名称, policy);
    }

    async deleteDbToolNetworkPolicy(dbToolApp名称: string, projectId: string) {
        const policy名称 = KubeObject名称Utils.toNetworkPolicy名称(dbToolApp名称);
        const existingNetworkPolicy = await this.getExistingNetworkPolicy(projectId, policy名称);
        if (!existingNetworkPolicy) {
            return;
        }
        await k3s.network.delete名称spacedNetworkPolicy(policy名称, projectId);
    }

    async reconcileFileBrowserNetworkPolicy(fileBrowserApp名称: string, projectId: string) {
        const policy名称 = KubeObject名称Utils.toNetworkPolicy名称(fileBrowserApp名称);
        const namespace = projectId;

        const policy: V1NetworkPolicy = {
            apiVersion: "networking.k8s.io/v1",
            kind: "NetworkPolicy",
            metadata: {
                name: policy名称,
                namespace: namespace,
                labels: {
                    app: fileBrowserApp名称,
                    'file-browser': 'true'
                },
                annotations: {
                    [Constants.QS_ANNOTATION_PROJECT_ID]: projectId,
                }
            },
            spec: {
                podSelector: {
                    matchLabels: {
                        app: fileBrowserApp名称
                    }
                },
                policyTypes: ["Ingress", "Egress"],
                ingress: [
                    {
                        // Allow from Traefik (internet traffic)
                        from: [
                            {
                                namespaceSelector: {
                                    matchLabels: {
                                        'kubernetes.io/metadata.name': 'kube-system'
                                    }
                                },
                                podSelector: {
                                    matchLabels: {
                                        'app.kubernetes.io/name': 'traefik'
                                    }
                                }
                            }
                        ]
                    }
                ],
                egress: [] // Deny all outgoing traffic
            }
        };
        console.log('Creating FileBrowser Network Policy:', JSON.stringify(policy, null, 2));
        await this.applyNetworkPolicy(namespace, policy名称, policy);
    }

    async deleteFileBrowserNetworkPolicy(fileBrowserApp名称: string, projectId: string) {
        const policy名称 = KubeObject名称Utils.toNetworkPolicy名称(fileBrowserApp名称);
        const existingNetworkPolicy = await this.getExistingNetworkPolicy(projectId, policy名称);
        if (!existingNetworkPolicy) {
            return;
        }
        await k3s.network.delete名称spacedNetworkPolicy(policy名称, projectId);
    }

    async deleteAllNetworkPolicies() {
        const namespaces = await k3s.core.list名称space();
        let deletedCount = 0;

        for (const ns of namespaces.body.items) {
            const namespace = ns.metadata?.name;
            if (!namespace) continue;

            try {
                const policies = await k3s.network.list名称spacedNetworkPolicy(namespace);
                for (const policy of policies.body.items) {
                    const policy名称 = policy.metadata?.name;
                    if (policy名称) {
                        await k3s.network.delete名称spacedNetworkPolicy(policy名称, namespace);
                        deletedCount++;
                    }
                }
            } catch (error) {
                console.error(`Error deleting network policies in namespace ${namespace}:`, error);
            }
        }

        return deletedCount;
    }
}

const networkPolicyService = new NetworkPolicyService();
export default networkPolicyService;


