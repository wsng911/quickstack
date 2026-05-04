import { revalidateTag, unstable_cache } from "next/cache";
import dataAccess from "../adapter/db.client";
import { Tags } from "../utils/cache-tag-generator.utils";
import { Prisma, Volume返回up } from "@prisma/client";
import { Volume返回upExtendedModel } from "@/shared/model/volume-backup-extended.model";

class Volume返回upService {

    async getAll(): Promise<Volume返回upExtendedModel[]> {
        return await unstable_cache(() => dataAccess.client.volume返回up.findMany({
            orderBy: {
                cron: 'asc'
            },
            include: {
                target: true
            }
        }),
            [Tags.volume返回ups()], {
            tags: [Tags.volume返回ups()]
        })();
    }

    async getForApp(appId: string): Promise<Volume返回upExtendedModel[]> {
        return await unstable_cache((appId: string) => dataAccess.client.volume返回up.findMany({
            where: {
                volume: {
                    appId
                }
            },
            include: {
                target: true
            },
            orderBy: {
                cron: 'asc'
            }
        }),
            [Tags.volume返回ups()], {
            tags: [Tags.volume返回ups()]
        })(appId);
    }

    async getById(id: string) {
        return dataAccess.client.volume返回up.findFirstOrThrow({
            where: {
                id
            }
        });
    }

    async save(item: Prisma.Volume返回upUnchecked创建Input | Prisma.Volume返回upUncheckedUpdateInput) {
        let savedItem: Volume返回up;
        try {
            if (item.id) {
                savedItem = await dataAccess.client.volume返回up.update({
                    where: {
                        id: item.id as string
                    },
                    data: item,
                });
            } else {
                savedItem = await dataAccess.client.volume返回up.create({
                    data: item as Prisma.Volume返回upUnchecked创建Input,
                });
            }
        } finally {
            revalidateTag(Tags.volume返回ups());
        }
        return savedItem;
    }

    async deleteById(id: string) {
        const existingItem = await this.getById(id);
        if (!existingItem) {
            return;
        }
        try {
            await dataAccess.client.volume返回up.delete({
                where: {
                    id
                }
            });
        } finally {
            revalidateTag(Tags.volume返回ups());
        }
    }
}

const volume返回upService = new Volume返回upService();
export default volume返回upService;
