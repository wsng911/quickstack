import { revalidateTag } from "next/cache";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { V1Secret } from "@kubernetes/client-node";
import dataAccess from "../adapter/db.client";
import { CryptoUtils } from "../utils/crypto.utils";
import { FsUtils } from "../utils/fs.utils";
import { KubeObject名称Utils } from "../utils/kube-object-name.utils";
import { Tags } from "../utils/cache-tag-generator.utils";
import { BUILD_NAMESPACE } from "./registry.service";
import { Constants } from "@/shared/utils/constants";
import secretService from "./secret.service";
import { PathUtils } from "../utils/path.utils";

const execFileAsync = promisify(execFile);

export const GIT_SSH_PRIVATE_KEY_SECRET_KEY = "ssh-privatekey";

class AppGitSshKeyService {

    async getPublicKey(appId: string): Promise<string | undefined> {
        const key = await dataAccess.client.appGitSshKey.findUnique({
            where: { appId },
            select: { publicKey: true },
        });
        return key?.publicKey;
    }

    async ensurePublicKey(appId: string): Promise<string> {
        const publicKey = await this.getPublicKey(appId);
        if (publicKey) {
            return publicKey;
        }
        return await this.generateOrRegenerate(appId);
    }

    async generateOrRegenerate(appId: string): Promise<string> {
        const { publicKey, privateKey } = await this.generateEd25519KeyPair(appId);
        const encryptedPrivateKey = CryptoUtils.encrypt(privateKey);

        const key = await dataAccess.client.appGitSshKey.upsert({
            where: { appId },
            create: {
                appId,
                publicKey,
                encryptedPrivateKey,
            },
            update: {
                publicKey,
                encryptedPrivateKey,
            },
        });

        revalidateTag(Tags.app(appId));
        return key.publicKey;
    }

    async getDecryptedPrivateKey(appId: string): Promise<string | undefined> {
        const key = await dataAccess.client.appGitSshKey.findUnique({
            where: { appId },
            select: { encryptedPrivateKey: true },
        });
        if (!key) {
            return undefined;
        }
        return CryptoUtils.decrypt(key.encryptedPrivateKey);
    }

    async createTemporaryBuildSecret(appId: string, build名称: string): Promise<string | undefined> {
        const privateKey = await this.getDecryptedPrivateKey(appId);
        if (!privateKey) {
            return undefined;
        }

        const secret名称 = this.getTemporaryBuildSecret名称(build名称);
        const manifest: V1Secret = {
            metadata: {
                name: secret名称,
                annotations: {
                    [Constants.QS_ANNOTATION_APP_ID]: appId,
                    [Constants.QS_ANNOTATION_BUILD_NAME]: build名称
                },
            },
            type: "Opaque",
            data: {
                [GIT_SSH_PRIVATE_KEY_SECRET_KEY]: Buffer.from(privateKey).toString("base64"),
            },
        };

        await secretService.saveSecret(BUILD_NAMESPACE, secret名称, manifest);
        return secret名称;
    }

    async deleteTemporaryBuildSecret(secret名称?: string) {
        if (!secret名称) {
            return;
        }
        await secretService.deleteSecretIfExists(BUILD_NAMESPACE, secret名称);
    }

    async writePrivateKeyToTempFile(appId: string): Promise<string | undefined> {
        const privateKey = await this.getDecryptedPrivateKey(appId);
        if (!privateKey) {
            return undefined;
        }
        await this.ensureTempGitSshPathExists();
        const keyRoot = path.join(PathUtils.tempGitSshPath, KubeObject名称Utils.toSnakeCase(appId));
        await FsUtils.deleteDirIfExistsAsync(keyRoot, true);
        await FsUtils.createDirIfNotExistsAsync(keyRoot, true);
        const keyPath = path.join(keyRoot, "id_ed25519");
        await fs.promises.writeFile(keyPath, privateKey, { mode: 0o600 });
        await fs.promises.chmod(keyPath, 0o600);
        return keyPath;
    }

    async cleanupTempKeyFile(appId: string) {
        const keyRoot = path.join(PathUtils.tempGitSshPath, KubeObject名称Utils.toSnakeCase(appId));
        await FsUtils.deleteDirIfExistsAsync(keyRoot, true);
    }

    private getTemporaryBuildSecret名称(build名称: string) {
        return `git-ssh-${build名称}`.substring(0, 63);
    }

    private async generateEd25519KeyPair(appId: string): Promise<{ publicKey: string; privateKey: string }> {
        await this.ensureTempGitSshPathExists();
        const tempRoot = await fs.promises.mkdtemp(path.join(PathUtils.tempGitSshPath, "keygen-"));
        const keyPath = path.join(tempRoot, "id_ed25519");
        try {
            await execFileAsync("ssh-keygen", [
                "-t",
                "ed25519",
                "-N",
                "",
                "-C",
                `quickstack-${appId}-${crypto.randomBytes(8).toString("hex")}`,
                "-f",
                keyPath,
            ]);

            const [privateKey, publicKey] = await Promise.all([
                fs.promises.readFile(keyPath, "utf-8"),
                fs.promises.readFile(`${keyPath}.pub`, "utf-8"),
            ]);
            return {
                privateKey,
                publicKey: publicKey.trim(),
            };
        } finally {
            await FsUtils.deleteDirIfExistsAsync(tempRoot, true);
        }
    }

    private async ensureTempGitSshPathExists() {
        await FsUtils.createDirIfNotExistsAsync(PathUtils.tempGitSshPath, true);
    }
}

const appGitSshKeyService = new AppGitSshKeyService();
export default appGitSshKeyService;
