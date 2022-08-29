import * as core from '@actions/core';
import AWS from 'aws-sdk';
import fs, { Dirent } from 'fs';
import * as path from 'path';
import { Object as S3Object } from 'aws-sdk/clients/s3';

const YANDEX_CLOUD_ENDPOINT = 'https://storage.yandexcloud.net';

type GithubActionInput = {
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    path: string;
    clear: boolean;
};

const convertStringToBoolean = (str: string) => str === 'true';

const inputs: GithubActionInput = {
    accessKeyId: core.getInput('YANDEX_CLOUD_ACCESS_KEY_ID', { required: true }),
    secretAccessKey: core.getInput('YANDEX_CLOUD_SECRET_ACCESS_KEY', { required: true }),
    bucketName: core.getInput('YANDEX_CLOUD_BUCKET_NAME', { required: true }),
    path: core.getInput('path', { required: true }),
    clear: convertStringToBoolean(core.getInput('clear', { required: false }))
};

const s3 = new AWS.S3({
    endpoint: YANDEX_CLOUD_ENDPOINT,
    accessKeyId: inputs.accessKeyId,
    secretAccessKey: inputs.secretAccessKey
});

const emptyS3Bucket = async (bucket: string) => {
    const listedObjects = await s3.listObjects({ Bucket: bucket }).promise();

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
        return;
    }

    const deleteKeys = listedObjects.Contents.map((c: S3Object) => ({ Key: c.Key as string }));

    await s3.deleteObjects({ Bucket: bucket, Delete: { Objects: deleteKeys } }).promise();

    if (listedObjects.IsTruncated) {
        await emptyS3Bucket(bucket);
    }
};

async function uploadData(s3Path: string, bucketName: string) {
    if (!fs.existsSync(s3Path)) {
        throw new Error(`Folder ${s3Path} doesn't exists`);
    }

    async function* getFiles(dir: string): any {
        const dirents: Dirent[] = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const dirent of dirents) {
            const res = path.resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                yield* getFiles(res);
            } else {
                yield res;
            }
        }
    }

    for await (const filePath of getFiles(s3Path)) {
        await s3
            .putObject({
                Key: path.relative(s3Path, filePath),
                Bucket: bucketName,
                Body: fs.createReadStream(filePath)
            })
            .promise();
    }
}

async function run() {
    if (inputs.clear) {
        await emptyS3Bucket(inputs.bucketName);
        core.info('Bucket was cleared successfully');
    }

    await uploadData(inputs.path, inputs.bucketName);
    core.info('Data uploaded successfully');
}

run().catch(err => core.setFailed(err));
