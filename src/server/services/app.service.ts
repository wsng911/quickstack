import { revalidateTag, unstable_cache } from "next/cache";
import dataAccess from "../adapter/db.client";
import { Tags } from "../utils/cache-tag-generator.utils";
import { App, AppBasicAuth, AppDomain, AppFileMount, AppNodePort, AppPort, AppVolume, Prisma } from "@prisma/client";
import { AppExtendedModel, AppWithProjectModel } from "@/shared/model/app-extended.model";
import { ServiceException } from "@/shared/model/service.exception.model";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import deploymentService from "./deployment.service";
import buildService from "./build.service";
import ingressService from "./ingress.service";
import pvcService from "./pvc.service";
import svcService from "./svc.service";
import deploymentLogService, { dlog } from "./deployment-logs.service";
import crypto from "crypto";
import networkPolicyService from "./network-policy.service";
import { AppBasicAuthModel, AppDomainModel, AppFileMountModel, AppModel, AppNodePortModel, AppPortModel, AppVolumeModel } from "@/shared/model/generated-zod";
import { z } from "zod";

class AppService {

    async buildAndDeploy(appId: string, forceBuild: boolean = false) {
        const deploymentId = crypto.randomUUID();
        return await deploymentLogService.catchErrosAndLog(deploymentId, async () => {
            const app = await this.getExtendedById(appId);

            await dlog(deploymentId, `
-----------------------------------------------
 Deployment:   ${deploymentId}
 App:          ${app.id}
 Project:      ${app.projectId}
-----------------------------------------------`, false);

            if (app.sourceType === 'GIT' || app.sourceType === 'GIT_SSH') {
                // first make build
                const [buildJob名称, gitCommitHash, gitCommitMessage, shouldDeployImmediately] = await buildService.buildApp(deploymentId, app, forceBuild);
                if (shouldDeployImmediately) {
                    dlog(deploymentId, `Starting deployment with output from build "${buildJob名称}"`);
                    await deploymentService.createDeployment(
                        deploymentId,
                        app,
                        buildJob名称,
                        gitCommitHash,
                        gitCommitMessage,
                        app.buildMethod === 'DOCKERFILE' ? 'DOCKERFILE' : 'RAILPACK',
                    );
                }
                // Otherwise the build-watch service will trigger the deployment once the build job completes
            } else {
                // only deploy
                await deploymentService.createDeployment(deploymentId, app);
            }
        });
    }

    async deleteById(id: string) {
        const existingApp = await this.getById(id);
        if (!existingApp) {
            return;
        }
        try {
            await svcService.deleteService(existingApp.projectId, existingApp.id);
            await deploymentService.deleteDeploymentIfExists(existingApp.projectId, existingApp.id);
            await ingressService.deleteAllIngressForApp(existingApp.projectId, existingApp.id);
            await pvcService.deleteAllPvcOfApp(existingApp.projectId, existingApp.id);
            await buildService.deleteAllBuildsOfApp(existingApp.id);
            await networkPolicyService.deleteNetworkPolicy(existingApp.id, existingApp.projectId);
            await dataAccess.client.app.delete({
                where: {
                    id
                }
            });
        } finally {
            revalidateTag(Tags.apps(existingApp.projectId));
            revalidateTag(Tags.app(existingApp.id));
            revalidateTag(Tags.projects());
            revalidateTag(Tags.userGroups());
            revalidateTag(Tags.users());
        }
    }

    async getAllAppsByProjectID(projectId: string) {
        return await unstable_cache(async (projectId: string) => await dataAccess.client.app.findMany({
            where: {
                projectId
            },
            include: {
                appPorts: true,
                appDomains: true
            },
            orderBy: {
                name: 'asc'
            }
        }),
            [Tags.apps(projectId)], {
            tags: [Tags.apps(projectId)]
        })(projectId as string);
    }

    async getExtendedById(appId: string, cached = true, tx?: Prisma.TransactionClient): Promise<AppExtendedModel> {
        const include = {
            project: true,
            appDomains: true,
            appVolumes: true,
            appPorts: true,
            appNodePorts: true,
            appFileMounts: true,
            appBasicAuths: true
        };

        const client = tx || dataAccess.client;
        if (cached) {
            return await unstable_cache(async (id: string) => await client.app.findFirstOrThrow({
                where: {
                    id
                },
                include
            }),
                [Tags.app(appId)], {
                tags: [Tags.app(appId)]
            })(appId);
        } else {
            return await client.app.findFirstOrThrow({
                where: {
                    id: appId
                }, include
            });
        }
    }

    async getById(appId: string) {
        return await unstable_cache(async (id: string) => await dataAccess.client.app.findFirstOrThrow({
            where: {
                id
            }
        }),
            [Tags.app(appId)], {
            tags: [Tags.app(appId)]
        })(appId);
    }

    async getByWebhookId(webhookId: string) {
        return await dataAccess.client.app.findFirstOrThrow({
            where: {
                webhookId
            }
        });
    }

    async save(item: Prisma.AppUnchecked创建Input | Prisma.AppUncheckedUpdateInput, createDefaultPort = true, tx?: Prisma.TransactionClient) {
        let savedItem: App;
        const client = tx || dataAccess.client;
        try {
            if (item.id) {
                savedItem = await client.app.update({
                    where: {
                        id: item.id as string
                    },
                    data: item
                });
            } else {
                item.id = KubeObject名称Utils.toAppId(item.name as string);
                savedItem = await client.app.create({
                    data: item as Prisma.AppUnchecked创建Input
                });
                if (createDefaultPort) {
                    // add default port 80
                    await client.appPort.create({
                        data: {
                            appId: savedItem.id,
                            port: 80
                        }
                    });
                }
            }
        } finally {
            revalidateTag(Tags.apps(item.projectId as string));
            revalidateTag(Tags.app(item.id as string));
            revalidateTag(Tags.projects());
            revalidateTag(Tags.userGroups());
            revalidateTag(Tags.users());
        }
        return savedItem;
    }

    async saveAppExtendedModel(app: AppExtendedModel, tx?: Prisma.TransactionClient) {

        const parsedAppModel = AppModel.parse(app);
        await this.save({
            ...parsedAppModel,
            id: app.id
        }, false, tx);

        // for new objects, make sure some params are optional, wich will be created by prisma
        const optionalParam = z.object({
            id: z.string().optional(),
            appId: z.string().optional(),
            createdAt: z.date().optional(),
            updatedAt: z.date().optional(),
        });

        const parsedDomains = AppDomainModel.merge(optionalParam).array().parse(app.appDomains);
        for (const domain of parsedDomains) {
            await this.saveDomain({
                ...domain,
                appId: app.id
            }, tx);
        }

        const parsedVolumes = AppVolumeModel.merge(optionalParam).array().parse(app.appVolumes);
        for (const volume of parsedVolumes) {
            await this.saveVolume({
                ...volume,
                appId: app.id
            }, tx);
        }

        const parsedFileMounts = AppFileMountModel.merge(optionalParam).array().parse(app.appFileMounts);
        for (const fileMount of parsedFileMounts) {
            await this.saveFileMount({
                ...fileMount,
                appId: app.id
            }, tx);
        }

        const parsedPorts = AppPortModel.merge(optionalParam).array().parse(app.appPorts);
        for (const port of parsedPorts) {
            await this.savePort({
                ...port,
                appId: app.id
            }, tx);
        }

        const parsedNodePorts = AppNodePortModel.merge(optionalParam).array().parse(app.appNodePorts);
        for (const nodePort of parsedNodePorts) {
            await this.saveNodePort({
                ...nodePort,
                appId: app.id
            }, tx);
        }

        const parsedBasicAuths = AppBasicAuthModel.merge(optionalParam).array().parse(app.appBasicAuths);
        for (const basicAuth of parsedBasicAuths) {
            await this.saveBasicAuth({
                ...basicAuth,
                appId: app.id
            }, tx);
        }
    }

    async regenerateWebhookId(appId: string) {
        const existingApp = await this.getById(appId);

        const randomBytes = crypto.randomBytes(32).toString('hex');
        await this.save({
            ...existingApp,
            webhookId: randomBytes
        });
    }

    async saveDomain(domainToBe保存d: Prisma.AppDomainUnchecked创建Input | Prisma.AppDomainUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
        let savedItem: AppDomain;
        const client = tx || dataAccess.client;
        const existingApp = await this.getExtendedById(domainToBe保存d.appId as string);
        const existingDomainWithSameHostname = await client.appDomain.findFirst({
            where: {
                hostname: domainToBe保存d.hostname as string,
            }
        });
        try {
            if (domainToBe保存d.id) {
                if (domainToBe保存d.hostname === existingDomainWithSameHostname?.hostname &&
                    domainToBe保存d.id &&
                    domainToBe保存d.id !== existingDomainWithSameHostname?.id) {
                    throw new ServiceException("Hostname is already in use by this or another app.");
                }
                savedItem = await client.appDomain.update({
                    where: {
                        id: domainToBe保存d.id as string
                    },
                    data: domainToBe保存d
                });
            } else {
                if (existingDomainWithSameHostname) {
                    throw new ServiceException("Hostname is already in use by this or another app.");
                }
                savedItem = await client.appDomain.create({
                    data: domainToBe保存d as Prisma.AppDomainUnchecked创建Input
                });
            }

        } finally {
            revalidateTag(Tags.apps(existingApp.projectId as string));
            revalidateTag(Tags.app(existingApp.id as string));
        }
        return savedItem;
    }

    async getDomainById(id: string) {
        return await dataAccess.client.appDomain.findFirstOrThrow({
            where: {
                id
            }
        });
    }

    async deleteDomainById(id: string) {
        const existingDomain = await dataAccess.client.appDomain.findFirst({
            where: {
                id
            }, include: {
                app: true
            }
        });
        if (!existingDomain) {
            return;
        }
        try {
            await dataAccess.client.appDomain.delete({
                where: {
                    id
                }
            });
        } finally {
            revalidateTag(Tags.app(existingDomain.appId));
            revalidateTag(Tags.apps(existingDomain.app.projectId));
        }
    }

    async getAllVolumesWithApp() {
        return await dataAccess.client.appVolume.findMany({
            include: {
                app: true
            },
            orderBy: {
                appId: 'asc'
            }
        });
    }

    async getVolumeById(id: string) {
        return await dataAccess.client.appVolume.findFirst({
            where: {
                id
            }
        });
    }

    async getShareableVolumesByProjectId(projectId: string, appId: string) {
        return await dataAccess.client.appVolume.findMany({
            where: {
                app: {
                    projectId
                },
                appId: {
                    not: appId
                },
                shareWithOtherApps: true,
                accessMode: 'ReadWriteMany',
                sharedVolumeId: null
            },
            include: {
                app: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async saveVolume(volumeToBe保存d: Prisma.AppVolumeUnchecked创建Input | Prisma.AppVolumeUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
        let savedItem: AppVolume;
        const client = tx || dataAccess.client;
        const existingApp = await this.getExtendedById(volumeToBe保存d.appId as string, false, client);
        const existingAppWithSameVolumeMountPath = await client.appVolume.findMany({
            where: {
                appId: volumeToBe保存d.appId as string,
            }
        });

        if (existingAppWithSameVolumeMountPath
            .filter(x => x.id !== volumeToBe保存d.id)
            .some(x => x.containerMountPath === volumeToBe保存d.containerMountPath)) {
            throw new ServiceException("Mount Path is already configured within the same app.");
        }

        try {
            if (volumeToBe保存d.id) {
                savedItem = await client.appVolume.update({
                    where: {
                        id: volumeToBe保存d.id as string
                    },
                    data: volumeToBe保存d
                });
            } else {
                savedItem = await client.appVolume.create({
                    data: volumeToBe保存d as Prisma.AppVolumeUnchecked创建Input
                });
            }

        } finally {
            revalidateTag(Tags.apps(existingApp.projectId as string));
            revalidateTag(Tags.app(existingApp.id as string));
        }
        return savedItem;
    }

    async deleteVolumeById(id: string) {
        const existingVolume = await dataAccess.client.appVolume.findFirst({
            where: {
                id
            }, include: {
                app: true,
                sharedVolumes: true
            }
        });
        if (!existingVolume) {
            return;
        }

        // get ids of all apps that use this volume as shared volume --> to reset cache
        let additionalAppIds = existingVolume.sharedVolumes.map(v => v.appId);
        try {
            await dataAccess.client.appVolume.delete({
                where: {
                    id
                }
            });
        } finally {
            revalidateTag(Tags.app(existingVolume.appId));
            revalidateTag(Tags.apps(existingVolume.app.projectId));
            for (const appId of additionalAppIds) {
                revalidateTag(Tags.app(appId));
            }
        }
    }

    async saveFileMount(fileMountToBe保存d: Prisma.AppFileMountUnchecked创建Input | Prisma.AppFileMountUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
        let savedItem: AppFileMount;
        const client = tx || dataAccess.client;
        const existingApp = await this.getExtendedById(fileMountToBe保存d.appId as string, false, client);
        const existingAppWithSameVolumeMountPath = await client.appFileMount.findMany({
            where: {
                appId: fileMountToBe保存d.appId as string,
            }
        });

        if (existingAppWithSameVolumeMountPath.filter(x => x.id !== fileMountToBe保存d.id)
            .some(x => x.containerMountPath === fileMountToBe保存d.containerMountPath)) {
            throw new ServiceException("Mount Path is already configured within the same app.");
        }

        try {
            if (fileMountToBe保存d.id) {
                savedItem = await client.appFileMount.update({
                    where: {
                        id: fileMountToBe保存d.id as string
                    },
                    data: fileMountToBe保存d
                });
            } else {
                savedItem = await client.appFileMount.create({
                    data: fileMountToBe保存d as Prisma.AppFileMountUnchecked创建Input
                });
            }

        } finally {
            revalidateTag(Tags.apps(existingApp.projectId as string));
            revalidateTag(Tags.app(existingApp.id as string));
        }
        return savedItem;
    }

    async deleteFileMountById(id: string) {
        const existingVolume = await dataAccess.client.appFileMount.findFirst({
            where: {
                id
            }, include: {
                app: true
            }
        });
        if (!existingVolume) {
            return;
        }
        try {
            await dataAccess.client.appFileMount.delete({
                where: {
                    id
                }
            });
        } finally {
            revalidateTag(Tags.app(existingVolume.appId));
            revalidateTag(Tags.apps(existingVolume.app.projectId));
        }
    }

    async savePort(portToBe保存d: Prisma.AppPortUnchecked创建Input | Prisma.AppPortUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
        let savedItem: AppPort;
        const client = tx || dataAccess.client;
        const existingApp = await this.getExtendedById(portToBe保存d.appId as string, false, client);
        const allPortsOfApp = await client.appPort.findMany({
            where: {
                appId: portToBe保存d.appId as string,
            }
        });
        if (allPortsOfApp.filter(x => x.id !== portToBe保存d.id)
            .some(x => x.port === portToBe保存d.port)) {
            throw new ServiceException("Port is already configured within the same app.");
        }
        try {
            if (portToBe保存d.id) {
                savedItem = await client.appPort.update({
                    where: {
                        id: portToBe保存d.id as string
                    },
                    data: portToBe保存d
                });
            } else {
                savedItem = await client.appPort.create({
                    data: portToBe保存d as Prisma.AppPortUnchecked创建Input
                });
            }

        } finally {
            revalidateTag(Tags.apps(existingApp.projectId as string));
            revalidateTag(Tags.app(existingApp.id as string));
        }
        return savedItem;
    }

    async getPortById(portId: string) {
        return await dataAccess.client.appPort.findFirstOrThrow({
            where: {
                id: portId
            }
        });
    }

    async deletePortById(id: string) {
        const existingPort = await dataAccess.client.appPort.findFirst({
            where: {
                id
            }, include: {
                app: true
            }
        });
        if (!existingPort) {
            return;
        }
        try {
            await dataAccess.client.appPort.delete({
                where: {
                    id
                }
            });
        } finally {
            revalidateTag(Tags.app(existingPort.appId));
            revalidateTag(Tags.apps(existingPort.app.projectId));
        }
    }

    async saveBasicAuth(itemToBe保存d: Prisma.AppBasicAuthUnchecked创建Input | Prisma.AppBasicAuthUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
        let savedItem: AppBasicAuth;
        const client = tx || dataAccess.client;
        const existingApp = await this.getExtendedById(itemToBe保存d.appId as string, false, tx);
        try {
            if (itemToBe保存d.id) {
                savedItem = await client.appBasicAuth.update({
                    where: {
                        id: itemToBe保存d.id as string
                    },
                    data: itemToBe保存d
                });
            } else {
                savedItem = await client.appBasicAuth.create({
                    data: itemToBe保存d as Prisma.AppBasicAuthUnchecked创建Input
                });
            }

        } finally {
            revalidateTag(Tags.apps(existingApp.projectId as string));
            revalidateTag(Tags.app(existingApp.id as string));
        }
        return savedItem;
    }

    async deleteBasicAuthById(id: string) {
        const existingItem = await dataAccess.client.appBasicAuth.findFirst({
            where: {
                id
            }, include: {
                app: true
            }
        });
        if (!existingItem) {
            return;
        }
        try {
            await dataAccess.client.appBasicAuth.delete({
                where: {
                    id
                }
            });
        } finally {
            revalidateTag(Tags.app(existingItem.appId));
            revalidateTag(Tags.apps(existingItem.app.projectId));
        }
    }

    async getBasicAuthById(id: string) {
        return await dataAccess.client.appBasicAuth.findFirstOrThrow({
            where: {
                id
            }
        });
    }

    async getAll() {
        const apps = await dataAccess.client.app.findMany({
            orderBy: {
                name: 'asc'
            },
            include: {
                project: true,
            }
        }) as AppWithProjectModel[];

        apps.sort((a, b) => {
            if (a.project.name.toLocaleLowerCase() < b.project.name.toLocaleLowerCase()) {
                return -1;
            }
            if (a.project.name.toLocaleLowerCase() > b.project.name.toLocaleLowerCase()) {
                return 1;
            }
            if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase()) {
                return -1;
            }
            if (a.name.toLocaleLowerCase() > b.name.toLocaleLowerCase()) {
                return 1;
            }
            return 0;
        });
        return apps;
    }

    async saveNodePort(nodePortToBe保存d: Prisma.AppNodePortUnchecked创建Input | Prisma.AppNodePortUncheckedUpdateInput, tx?: Prisma.TransactionClient) {
        const client = tx || dataAccess.client;
        const existingApp = await this.getExtendedById(nodePortToBe保存d.appId as string, false, client);

        const nodePortValue = nodePortToBe保存d.nodePort as number;
        const existingWithSameNodePort = await client.appNodePort.findFirst({
            where: {
                nodePort: nodePortValue,
                NOT: { id: nodePortToBe保存d.id as string | undefined },
            }
        });
        if (existingWithSameNodePort) {
            throw new ServiceException(`Node port ${nodePortValue} is already in use by another app.`);
        }

        let savedItem: AppNodePort;
        try {
            if (nodePortToBe保存d.id) {
                savedItem = await client.appNodePort.update({
                    where: { id: nodePortToBe保存d.id as string },
                    data: nodePortToBe保存d,
                });
            } else {
                savedItem = await client.appNodePort.create({
                    data: nodePortToBe保存d as Prisma.AppNodePortUnchecked创建Input,
                });
            }
        } finally {
            revalidateTag(Tags.apps(existingApp.projectId as string));
            revalidateTag(Tags.app(existingApp.id as string));
        }
        return savedItem;
    }

    async getNodePortById(id: string) {
        return await dataAccess.client.appNodePort.findFirstOrThrow({
            where: { id },
        });
    }

    async deleteNodePortById(id: string) {
        const existing = await dataAccess.client.appNodePort.findFirst({
            where: { id },
            include: { app: true },
        });
        if (!existing) {
            return;
        }
        try {
            await dataAccess.client.appNodePort.delete({
                where: { id },
            });
        } finally {
            revalidateTag(Tags.app(existing.appId));
            revalidateTag(Tags.apps(existing.app.projectId));
        }
    }
}

const appService = new AppService();
export default appService;
