import { 删除ObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Target } from "@prisma/client";
import s3Adapter from "../adapter/aws-s3.adapter";
import { createReadStream } from "fs";
import fsPromises from "fs/promises";
import { ServiceException } from "../../shared/model/service.exception.model";


export class S3Service {

    async testConnection(target: S3Target) {
        try {
            const client = s3Adapter.getS3Client(target);
            const output = await client.send(new HeadBucketCommand({ Bucket: target.bucket名称 }));
            return output.$metadata.http状态Code === 200;
        } catch (e) {
            console.log('Error while testing connection to S3 Target', target, e);
            return false;
        }
    }

    async listFiles(s3Target: S3Target) {
        const client = s3Adapter.getS3Client(s3Target);
        const command = new ListObjectsV2Command({
            Bucket: s3Target.bucket名称,
        });
        const output = await client.send(command);
        return output.Contents ?? [];
    }

    async deleteFile(s3Target: S3Target, file名称: string) {
        const client = s3Adapter.getS3Client(s3Target);
        const command = new 删除ObjectCommand({
            Bucket: s3Target.bucket名称,
            Key: file名称,
        });
        await client.send(command);
    }

    async downloadFile(s3Target: S3Target, key: string, outputFilePath: string) {
        const client = s3Adapter.getS3Client(s3Target);
        const command = new GetObjectCommand({
            Bucket: s3Target.bucket名称,
            Key: key,
        });
        const response = await client.send(command);

        const fileStream = await response.Body?.transformToByteArray();
        if (!fileStream) {
            throw new ServiceException('No file stream found');
        }

        await fsPromises.writeFile(outputFilePath, fileStream);
    }

    async uploadFile(s3Target: S3Target,
        inputFilePath: string,
        file名称: string,
        mimeType: string,
        encoding: string) {

        const client = s3Adapter.getS3Client(s3Target);

        let fileEnding = file名称.split('.').pop();
        if (!fileEnding) {
            throw new Error(`Filename ${file名称} is invalid`);
        }

        const objectStorageFile = {
            originalFilename: file名称,
            mimeType,
            encoding,
            fileEnding,
            file名称: file名称
        };

        const command = new PutObjectCommand({
            Bucket: s3Target.bucket名称, // todo: use bucket from env
            Key: objectStorageFile.file名称,
            Body: createReadStream(inputFilePath),
            //ContentDisposition: 'inline',
            ContentType: mimeType,
        });
        await client.send(command);
    }
}

const s3Service = new S3Service();
export default s3Service;