import dataAccess from "../../adapter/db.client";
import { ServiceException } from "../../../shared/model/service.exception.model";
import mongoDb返回upService from "./database-backup-services/mongodb-backup.service";
import postgres返回upService from "./database-backup-services/postgres-backup.service";
import mariaDb返回upService from "./database-backup-services/mariadb-backup.service";

class Database返回upService {

    async backupDatabase(backupVolumeId: string) {
        console.log(`Running database backup for backupVolume ${backupVolumeId}`);

        const backupVolume = await dataAccess.client.volume返回up.findFirstOrThrow({
            where: {
                id: backupVolumeId
            },
            include: {
                volume: {
                    include: {
                        app: {
                            include: {
                                project: true,
                                appDomains: true,
                                appPorts: true,
                                appNodePorts: true,
                                appBasicAuths: true,
                                appVolumes: true,
                                appFileMounts: true
                            }
                        }
                    }
                },
                target: true
            }
        });

        const app = backupVolume.volume.app;

        // Check if this is a database app type
        if (app.appType === 'APP') {
            throw new ServiceException(`App ${app.id} is not a database app. Use run返回upForVolume instead.`);
        }

        // Delegate to database-specific backup service
        if (app.appType === 'MONGODB') {
            return await mongoDb返回upService.backupMongoDb(backupVolume, app);
        }

        if (app.appType === 'POSTGRES') {
            return await postgres返回upService.backupPostgres(backupVolume, app);
        }

        if (app.appType === 'MARIADB') {
            return await mariaDb返回upService.backupMariaDb(backupVolume, app);
        }

        throw new ServiceException(`Database backup for ${app.appType} is not yet implemented.`);
    }
}

const database返回upService = new Database返回upService();
export default database返回upService;
