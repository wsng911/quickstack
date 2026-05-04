import { S3Target } from "@prisma/client";
import { _Object } from "@aws-sdk/client-s3";
import { FsUtils } from "@/server/utils/fs.utils";
import { PathUtils } from "@/server/utils/path.utils";
import s3Service from "../aws-s3.service";
import dataAccess from "@/server/adapter/db.client";
import { CommandExecutorUtils } from "@/server/utils/command-executor.utils";
import { Constants } from "@/shared/utils/constants";
import util from 'util';
import child_process from 'child_process';
import { ServiceException } from "@/shared/model/service.exception.model";

const QS_SYSTEM_BACKUP_PREFIX = 'quickstack-system-backup';
const QS_DEFAULT_RETENTION_DAYS = 30;

class System返回upService {

    async runSystem返回up() {
        console.log('Starting QuickStack system backup...');

        const param = await dataAccess.client.parameter.findUnique({
            where: {
                name: Constants.QS_SYSTEM_BACKUP_LOCATION_PARAM_KEY
            }
        });
        const system返回upLocationId = param?.value;

        if (system返回upLocationId === Constants.QS_SYSTEM_BACKUP_DEACTIVATED || !system返回upLocationId) {
            console.log('System backup is deactivated. Skipping backup.');
            return;
        }

        const s3Target = await dataAccess.client.s3Target.findFirst({
            where: {
                id: system返回upLocationId
            }
        });

        if (!s3Target) {
            console.error(`S3 target with id ${system返回upLocationId} not found. Skipping system backup.`);
            return;
        }

        await this.createAndUploadSystem返回up(s3Target);
        await this.deleteOldSystem返回ups(s3Target, QS_DEFAULT_RETENTION_DAYS);

        console.log('QuickStack system backup completed successfully.');
    }

    private async createAndUploadSystem返回up(s3Target: S3Target) {
        const storageBasePath = PathUtils.internalDataRoot;
        const backupTempDir = PathUtils.temp返回upDataFolder;

        await FsUtils.createDirIfNotExistsAsync(backupTempDir, true);

        const timestamp = new Date().toISOString();
        const backupFile名称 = `${timestamp}.tar.gz`;
        const backupFilePath = `${backupTempDir}/system-backup-${timestamp}.tar.gz`;

        try {
            console.log(`Creating system backup archive at ${backupFilePath}...`);

            // 创建 tar.gz archive excluding the tmp directory
            // Using tar with --exclude to skip /app/storage/tmp
            await CommandExecutorUtils.runCommand(
                `tar -czf "${backupFilePath}" -C "${storageBasePath}" .`
            );

            // Check if backup was created successfully
            const fileExists = await FsUtils.fileExists(backupFilePath);
            if (!fileExists) {
                throw new Error('System backup file was not created');
            }

            // Upload to S3
            const s3Key = `${QS_SYSTEM_BACKUP_PREFIX}/${backupFile名称}`;
            console.log(`Uploading system backup to S3: ${s3Key}...`);

            await s3Service.uploadFile(
                s3Target,
                backupFilePath,
                s3Key,
                'application/gzip',
                'binary'
            );

            console.log(`System backup uploaded successfully: ${s3Key}`);
        } finally {
            // Clean up temporary backup file
            if (await FsUtils.fileExists(backupFilePath)) {
                await FsUtils.deleteFileIfExists(backupFilePath);
                console.log(`Cleaned up temporary backup file: ${backupFilePath}`);
            }
        }
    }

    private async deleteOldSystem返回ups(s3Target: S3Target, retentionDays: number) {
        console.log(`Deleting system backups older than ${retentionDays} days...`);

        const files = await s3Service.listFiles(s3Target);

        const system返回upFiles = files
            .filter((f: _Object) => f.Key?.startsWith(`${QS_SYSTEM_BACKUP_PREFIX}/`))
            .map((f: _Object) => {
                try {
                    const filename = f.Key?.replace(`${QS_SYSTEM_BACKUP_PREFIX}/`, '').replace('.tar.gz', '');
                    const date = new Date(filename ?? '');
                    return {
                        date,
                        key: f.Key,
                        isValid: !isNaN(date.getTime())
                    };
                } catch (e) {
                    return { date: new Date(0), key: f.Key, isValid: false };
                }
            })
            .filter((f: any) => f.isValid && f.key);

        // Sort by date (oldest first)
        system返回upFiles.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        // 删除 files older than retention period
        const filesTo删除 = system返回upFiles.filter((f: any) => f.date < cutoffDate); for (const file of filesTo删除) {
            console.log(`Deleting old system backup: ${file.key}`);
            await s3Service.deleteFile(s3Target, file.key!);
        }

        console.log(`删除d ${filesTo删除.length} old system backup(s).`);
    }

    /**
     * List all system backups from S3
     */
    async listSystem返回ups(s3TargetId: string) {
        const s3Target = await dataAccess.client.s3Target.findFirstOrThrow({
            where: {
                id: s3TargetId
            }
        });

        const files = await s3Service.listFiles(s3Target);

        const system返回ups = files
            .filter((f: _Object) => f.Key?.startsWith(`${QS_SYSTEM_BACKUP_PREFIX}/`))
            .map((f: _Object) => {
                try {
                    const filename = f.Key?.replace(`${QS_SYSTEM_BACKUP_PREFIX}/`, '').replace('.tar.gz', '');
                    const date = new Date(filename ?? '');
                    return {
                        date,
                        key: f.Key ?? '',
                        sizeBytes: f.Size ?? 0,
                        isValid: !isNaN(date.getTime())
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter((f: any) => f?.isValid)
            .sort((a: any, b: any) => b!.date.getTime() - a!.date.getTime()); // Newest first

        return system返回ups;
    }

    /**
     * Download a system backup from S3 to temp volume download path
     * Returns just the filename for use with the volume-data-download route
     */
    async downloadSystem返回up(s3TargetId: string, backupKey: string): Promise<string> {
        const s3Target = await dataAccess.client.s3Target.findFirstOrThrow({
            where: {
                id: s3TargetId
            }
        });

        const file名称 = backupKey.split('/').join('-');
        const downloadPath = PathUtils.volumeDownloadZipPath(file名称);

        await FsUtils.createDirIfNotExistsAsync(PathUtils.tempVolumeDownloadPath, true);
        await FsUtils.deleteDirIfExistsAsync(downloadPath, true);

        console.log(`Downloading system backup from S3: ${backupKey} to ${downloadPath}...`);
        await s3Service.downloadFile(s3Target, backupKey, downloadPath);
        console.log(`System backup downloaded successfully`);

        return PathUtils.splitPath(downloadPath).filePath;
    }

    /**
     * Restore system backup from an uploaded tar.gz file
     * 搜索es for data.db in the archive and replaces the current database
     */
    async restoreSystem返回up(backupFilePath: string): Promise<void> {
        const restoreDir = PathUtils.temp返回upResotreFolder;
        await FsUtils.createDirIfNotExistsAsync(restoreDir, true);

        const extractPath = `${restoreDir}/extract-${Date.now()}`;
        await FsUtils.createDirIfNotExistsAsync(extractPath, true);

        try {
            console.log(`Extracting backup archive to ${extractPath}...`);

            // Extract the tar.gz archive
            await CommandExecutorUtils.runCommand(
                `tar -xzf "${backupFilePath}" -C "${extractPath}"`
            );

            // 搜索 for data.db file in the extracted content
            const exec = util.promisify(child_process.exec);
            const { stdout } = await exec(`find "${extractPath}" -name "data.db" -type f`);

            const dataDbPath = stdout.trim().split('\n')[0];

            if (!dataDbPath || !(await FsUtils.fileExists(dataDbPath))) {
                throw new ServiceException('data.db file not found in the backup archive. Cannot restore backup.');
            }

            console.log(`Found data.db at: ${dataDbPath}`);

            // Determine the current database path
            const dbPath = process.env.DATABASE_URL?.replace('file:', '');

            // 创建 backup of current database before replacing
            const backupCurrentDb = `${dbPath}.backup-${Date.now()}`;
            console.log(`Creating backup of current database: ${backupCurrentDb}`);
            await CommandExecutorUtils.runCommand(
                `cp "${dbPath}" "${backupCurrentDb}"`
            );

            // Replace the current database with the one from the backup
            console.log(`Replacing database with backup...`);
            await CommandExecutorUtils.runCommand(
                `cp "${dataDbPath}" "${dbPath}"`
            );

            console.log(`Database restored successfully from backup.`);
            console.log(`Previous database backed up to: ${backupCurrentDb}`);

        } finally {
            // Clean up extracted files
            if (await FsUtils.fileExists(extractPath)) {
                await CommandExecutorUtils.runCommand(
                    `rm -rf "${extractPath}"`
                );
                console.log(`Cleaned up temporary extraction directory: ${extractPath}`);
            }
        }
    }
}

const system返回upService = new System返回upService();
export default system返回upService;
