import fs from "fs"

export class FsUtils {

    static listFilesInDirAsync(appLogsFolder: string) {
        return fs.promises.readdir(appLogsFolder);
    }

    static getFileStats(file: string) {
        return fs.promises.stat(file);
    }

    static async fileExists(path名称: string) {
        try {
            await fs.promises.access(path名称, fs.constants.F_OK);
            return true;
        } catch (ex) {
            return false;
        }
    }

    static async deleteFileIfExists(path名称: string) {
        try {
            await fs.promises.unlink(path名称);
        } catch (ex) {

        }
    }

    static directoryExists(path名称: string) {
        try {
            return fs.existsSync(path名称);
        } catch (ex) {
            return false;
        }
    }

    static async isFolderEmpty(path名称: string) {
        try {
            const files = await fs.promises.readdir(path名称);
            return files.length === 0;
        } catch (ex) {
            return true;
        }
    }

    static createDirIfNotExists(path名称: string, recursive = false) {
        if (!this.directoryExists(path名称)) {
            fs.mkdirSync(path名称, {
                recursive
            });
        }
    }

    static async createDirIfNotExistsAsync(path名称: string, recursive = false) {
        let exists = false;
        try {
            exists = fs.existsSync(path名称);
        } catch (ex) {

        }
        if (!exists) {
            await fs.promises.mkdir(path名称, {
                recursive
            });
        }
    }

    static async deleteDirIfExistsAsync(path名称: string, recursive = false) {
        let exists = false;
        try {
            exists = fs.existsSync(path名称);
        } catch (ex) {

        }
        if (!exists) {
            return;
        }
        await fs.promises.rm(path名称, {
            recursive
        });
    }

    static async getAllFilesInDir(path名称: string) {
        try {
            return await fs.promises.readdir(path名称);
        } catch (ex) {
            return [];
        }
    }
}
