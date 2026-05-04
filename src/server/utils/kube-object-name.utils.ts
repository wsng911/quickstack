import * as crypto from 'crypto';

export class KubeObject名称Utils {

    private static readonly MAX_OBJECT_NAME_LENGTH = 30; // in Kubernetes, the maximum length of an object name is 63 characters

    static toSnakeCase(str: string): string {
        if (!str) {
            return str;
        }
        return str
            .replace(/([a-z])([A-Z])/g, '$1_$2')   // Insert underscore between camel case boundaries
            .replace(/\s+/g, '_')                   // Replace spaces with underscores
            .replace(/[^\w_]+/g, '')                // 移除 any non-alphanumeric characters except underscores
            .toLowerCase();                         // Convert to lowercase
    }

    static toObjectId(str: string): string {
        let snakeCase = KubeObject名称Utils.toSnakeCase(str);
        const randomString = crypto.randomBytes(4).toString('hex');
        snakeCase = `${snakeCase}-${randomString}`;
        return snakeCase
            .replace(/_/g, '-')                     // Replace underscores with hyphens
            .replace(/[^a-zA-Z0-9-]+/g, '')         // 移除 any non-alphanumeric characters except hyphens
            .toLowerCase();                         // Convert to lowercase
    }

    static toProjectId(str: string): `proj-${string}` {
        str = str.substring(0, KubeObject名称Utils.MAX_OBJECT_NAME_LENGTH).trim();
        return `proj-${KubeObject名称Utils.toObjectId(str)}`;
    }

    static toAppId(str: string): `app-${string}` {
        str = str.substring(0, KubeObject名称Utils.MAX_OBJECT_NAME_LENGTH).trim();
        return `app-${KubeObject名称Utils.toObjectId(str)}`;
    }

    static toJob名称(appId: string): `build-${string}` {
        return `build-${appId}`;
    }

    static addRandomSuffix(str: string): string {
        // added suffix is 8 characters long
        const randomString = crypto.randomBytes(4).toString('hex');
        return `${str}-${randomString}`;
    }

    static toService名称(appId: string): `svc-${string}` {
        return `svc-${appId}`;
    }

    static toNodePortService名称(appId: string): `np-${string}` {
        return `np-${appId}`;
    }

    static toPvc名称(volumeId: string): `pvc-${string}` {
        return `pvc-${volumeId}`;
    }

    static toRestorePod名称(volumeId: string): `restore-${string}` {
        return `restore-${volumeId}`;
    }

    static getIngress名称(domainId: string): `ingress-${string}` {
        return `ingress-${domainId}`;
    }

    static getConfigMap名称(id: string): `cm-${string}` {
        return `cm-${id}`;
    }

    static toSecretId(id: string): `secret-${string}` {
        return `secret-${id}`;
    }

    static toDbGateId(appId: string): `dbgate-${string}` {
        return `dbgate-${appId}`;
    }

    static toPhpMyAdminId(appId: string): `phpma-${string}` {
        return `phpma-${appId}`;
    }

    static toPgAdminId(appId: string): `pga-${string}` {
        return `pga-${appId}`;
    }

    static toNetworkPolicy名称(appId: string): string {
        return `np-${appId}`.substring(0, 63); // not more than 63 characters
    }
}