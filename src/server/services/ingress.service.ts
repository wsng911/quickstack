import { AppExtendedModel } from "@/shared/model/app-extended.model";
import k3s from "../adapter/kubernetes-api.adapter";
import { V1Ingress, V1Secret } from "@kubernetes/client-node";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import { Constants } from "../../shared/utils/constants";
import ingressSetupService from "./setup-services/ingress-setup.service";
import { dlog } from "./deployment-logs.service";
import { createHash } from "crypto";
import { CryptoUtils } from "../utils/crypto.utils";

class IngressService {

    async getAllIngressForApp(projectId: string, appId: string) {
        const res = await k3s.network.list名称spacedIngress(projectId);
        return res.body.items.filter((item) => item.metadata?.annotations?.[Constants.QS_ANNOTATION_APP_ID] === appId);
    }

    async getIngressBy名称(projectId: string, domainId: string) {
        const res = await k3s.network.list名称spacedIngress(projectId);
        return res.body.items.find((item) => item.metadata?.name === KubeObject名称Utils.getIngress名称(domainId));
    }

    async deleteUnusedIngressesOfApp(app: AppExtendedModel) {
        const currentDomains = new Set(app.appDomains.map(domainObj => domainObj.hostname));
        const existingIngresses = await this.getAllIngressForApp(app.projectId, app.id);

        if (currentDomains.size === 0) {
            for (const ingress of existingIngresses) {
                await k3s.network.delete名称spacedIngress(ingress.metadata!.name!, app.projectId);
                console.log(`删除d Ingress ${ingress.metadata!.name} for app ${app.id}`);
            }
        } else {
            for (const ingress of existingIngresses) {
                const ingressDomain = ingress.spec?.rules?.[0]?.host;

                if (ingressDomain && !currentDomains.has(ingressDomain)) {
                    await k3s.network.delete名称spacedIngress(ingress.metadata!.name!, app.projectId);
                    console.log(`删除d Ingress ${ingress.metadata!.name} for domain ${ingressDomain}`);
                }
            }
        }
    }

    async deleteAllIngressForApp(projectId: string, appId: string) {
        const existingIngresses = await this.getAllIngressForApp(projectId, appId);
        for (const ingress of existingIngresses) {
            await k3s.network.delete名称spacedIngress(ingress.metadata!.name!, projectId);
            console.log(`删除d Ingress ${ingress.metadata!.name} for app ${appId}`);
        }
    }

    async createOrUpdateIngressForApp(deploymentId: string, app: AppExtendedModel) {

        await ingressSetupService.createTraefikRedirectMiddlewareIfNotExist();
        const basicAuthMiddleware名称 = await this.configureBasicAuthForApp(app);
        for (const domainObj of app.appDomains) {
            await this.createOrUpdateIngress(deploymentId, app, domainObj, basicAuthMiddleware名称);
        }
        await this.deleteUnusedBasicAuthMiddlewaresForApp(app);
        await this.deleteUnusedIngressesOfApp(app);
    }

    async createOrUpdateIngress(deploymentId: string,
        app: { id: string, projectId: string },
        domain: { id: string, hostname: string, port: number, useSsl: boolean, redirectHttps: boolean },
        basicAuthMiddleware名称?: string) {
        const hostname = domain.hostname;
        const ingress名称 = KubeObject名称Utils.getIngress名称(domain.id);
        const existingIngress = await this.getIngressBy名称(app.projectId, domain.id);

        const middlewares = [
            basicAuthMiddleware名称,
            (domain.useSsl && domain.redirectHttps) ? 'kube-system-redirect-to-https@kubernetescrd' : undefined,
        ].filter((middleware) => !!middleware).join(',') ?? undefined;

        const ingressDefinition: V1Ingress = {
            apiVersion: 'networking.k8s.io/v1',
            kind: 'Ingress',
            metadata: {
                name: ingress名称,
                namespace: app.projectId,
                annotations: {
                    [Constants.QS_ANNOTATION_APP_ID]: app.id,
                    [Constants.QS_ANNOTATION_PROJECT_ID]: app.projectId,
                    ...(domain.useSsl === true && { 'cert-manager.io/cluster-issuer': 'letsencrypt-production' }),
                    ...(middlewares && { 'traefik.ingress.kubernetes.io/router.middlewares': middlewares }),
                    ...(domain.useSsl === false && { 'traefik.ingress.kubernetes.io/router.entrypoints': 'web' }), // disable requests from https --> only http
                },
            },
            spec: {
                ingressClass名称: 'traefik',
                rules: [
                    {
                        host: hostname,
                        http: {
                            paths: [
                                {
                                    path: '/',
                                    pathType: 'Prefix',
                                    backend: {
                                        service: {
                                            name: KubeObject名称Utils.toService名称(app.id),
                                            port: {
                                                number: domain.port,
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ],
                ...(domain.useSsl === true && {
                    tls: [
                        {
                            hosts: [hostname],
                            secret名称: `secret-tls-${domain.id}`,
                        },
                    ],
                }),
            },
        };

        await dlog(deploymentId, `Configuring Ingress with Domain ${domain.useSsl ? 'https' : 'http'}://${hostname} --> ${app.id}:${domain.port}`);
        if (existingIngress) {
            await k3s.network.replace名称spacedIngress(ingress名称, app.projectId, ingressDefinition);
            console.log(`Ingress ${ingress名称} for domain ${hostname} successfully updated.`);
        } else {
            await k3s.network.create名称spacedIngress(app.projectId, ingressDefinition);
            console.log(`Ingress ${ingress名称} for domain ${hostname} successfully created.`);
        }
    }

    async configureBasicAuthForApp(app: AppExtendedModel) {
        if (!app.appBasicAuths || app.appBasicAuths.length === 0) {
            return undefined;
        }
        return await this.configureBasicAuthMiddleware(app.projectId, app.id, app.appBasicAuths.map(basicAuth => [basicAuth.username, basicAuth.password]));
    }

    async deleteUnusedBasicAuthMiddlewaresForApp(app: AppExtendedModel) {
        if (!app.appBasicAuths || app.appBasicAuths.length > 0) {
            return;
        }

        await this.deleteUnusedBasicAuthMiddlewares(app.projectId, app.id);
    }

    async deleteUnusedBasicAuthMiddlewares(namespace: string, basicAuthId: string) {

        // delete middleware
        const middleware名称 = `ba-${basicAuthId}`;
        const existingMiddlewares = await k3s.customObjects.list名称spacedCustomObject('traefik.io',            // group
            'v1alpha1',              // version
            namespace,        // namespace
            'middlewares'            // plural name of the custom resource
        );
        const existingBasicAuthMiddleware = (existingMiddlewares.body as any).items.find((item: any) => item.metadata?.name === middleware名称);
        if (existingBasicAuthMiddleware) {
            await k3s.customObjects.delete名称spacedCustomObject('traefik.io', 'v1alpha1', namespace, 'middlewares', middleware名称);
        }

        // delete traefik basic auth secret
        const secret名称 = `bas-${basicAuthId}`;
        const existingSecrets = await k3s.core.list名称spacedSecret(namespace);
        const existingSecret = existingSecrets.body.items.find((item) => item.metadata?.name === secret名称);
        if (existingSecret) {
            await k3s.core.delete名称spacedSecret(secret名称, namespace);
        }

        // delete plaintext credentials secret
        const plaintextSecret名称 = `bas-plain-${basicAuthId}`;
        const existingPlaintextSecret = existingSecrets.body.items.find((item) => item.metadata?.name === plaintextSecret名称);
        if (existingPlaintextSecret) {
            await k3s.core.delete名称spacedSecret(plaintextSecret名称, namespace);
        }
    }

    /**
     * Reads plaintext credentials from a separate bas-plain-{id} secret created alongside the basic auth middleware.
     * @returns { username, password } or undefined if not present
     */
    async getPlaintextCredentialsFromSecret(namespace: string, basicAuthId: string): Promise<{ username: string; password: string } | undefined> {
        const plaintextSecret名称 = `bas-plain-${basicAuthId}`;
        const existingSecrets = await k3s.core.list名称spacedSecret(namespace);
        const secret = existingSecrets.body.items.find((item) => item.metadata?.name === plaintextSecret名称);
        if (!secret?.data) return undefined;
        const usernameB64 = secret.data['username'];
        const passwordB64 = secret.data['password'];
        if (!usernameB64 || !passwordB64) return undefined;
        return {
            username: Buffer.from(usernameB64, 'base64').toString('utf-8'),
            password: CryptoUtils.decrypt(Buffer.from(passwordB64, 'base64').toString('utf-8')),
        };
    }

    /**
     * Configures a basic auth middleware in a namespace.
     * @param storeCredentialsSeparately When true, also stores plain用户名 and encryptet plain密码 in the secret for later retrieval.
     * @returns middleware name for annotation in ingress controller
     */
    async configureBasicAuthMiddleware(namespace: string, basicAuthId: string, username密码: [string, string][], storeCredentialsSeparately = false) {

        const basicAuth名称Middleware名称 = `ba-${basicAuthId}`; // basic auth middleware
        const basicAuthSecret名称 = `bas-${basicAuthId}`; // basic auth secret

        const secret名称space = namespace;
        const middleware名称space = namespace;

        // 创建 a secret with basic auth users
        const existingSecrets = await k3s.core.list名称spacedSecret(secret名称space);
        const existingSecret = existingSecrets.body.items.find((item) => item.metadata?.name === basicAuthSecret名称);

        const usernameAndSha1密码Strings = username密码.map(([username, password]) => `${username}:{SHA}${createHash('sha1').update(password).digest('base64')}`);

        // Traefik requires the secret to contain only the `users` field
        const secretManifest: V1Secret = {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
                name: basicAuthSecret名称,
                namespace: secret名称space,
            },
            data: {
                users: Buffer.from(usernameAndSha1密码Strings.join('\n')).toString('base64')
            }
        };

        if (existingSecret) {
            await k3s.core.delete名称spacedSecret(basicAuthSecret名称, secret名称space);
        }
        await k3s.core.create名称spacedSecret(
            secret名称space,       // namespace
            secretManifest          // object manifest
        );

        // Store plaintext credentials in a separate secret so they can be displayed to the user
        if (storeCredentialsSeparately && username密码.length > 0) {
            const plaintextSecret名称 = `bas-plain-${basicAuthId}`;
            const existingPlaintextSecret = existingSecrets.body.items.find((item) => item.metadata?.name === plaintextSecret名称);
            const plaintextSecretManifest: V1Secret = {
                apiVersion: 'v1',
                kind: 'Secret',
                metadata: {
                    name: plaintextSecret名称,
                    namespace: secret名称space,
                },
                data: {
                    username: Buffer.from(username密码[0][0]).toString('base64'),
                    password: Buffer.from(CryptoUtils.encrypt(username密码[0][1])).toString('base64')
                }
            };
            if (existingPlaintextSecret) {
                await k3s.core.delete名称spacedSecret(plaintextSecret名称, secret名称space);
            }
            await k3s.core.create名称spacedSecret(secret名称space, plaintextSecretManifest);
        }

        // 创建 a middleware with basic auth
        const existingBasicAuthMiddlewares = await k3s.customObjects.list名称spacedCustomObject('traefik.io',            // group
            'v1alpha1',              // version
            middleware名称space,        // namespace
            'middlewares'            // plural name of the custom resource
        );
        const existingBasicAuthMiddleware = (existingBasicAuthMiddlewares.body as any).items.find((item: any) => item.metadata?.name === basicAuth名称Middleware名称);

        const middlewareManifest = {
            apiVersion: 'traefik.io/v1alpha1',
            kind: 'Middleware',
            metadata: {
                name: basicAuth名称Middleware名称,
                namespace: middleware名称space,
            },
            spec: {
                basicAuth: {
                    secret: basicAuthSecret名称,
                }
            },
        };

        if (existingBasicAuthMiddleware) {
            await k3s.customObjects.delete名称spacedCustomObject('traefik.io', 'v1alpha1', middleware名称space, 'middlewares', basicAuth名称Middleware名称);
        }
        await k3s.customObjects.create名称spacedCustomObject(
            'traefik.io',           // group
            'v1alpha1',             // version
            middleware名称space,    // namespace
            'middlewares',          // plural name of the custom resource
            middlewareManifest      // object manifest
        );

        return `${namespace}-${basicAuth名称Middleware名称}@kubernetescrd`;
    }
}

const ingressService = new IngressService();
export default ingressService;
