import {
    CreateBucketCommand,
    HeadBucketCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";

export const storageConfig = {
    get endpoint() {
        return process.env.MINIO_ENDPOINT ?? "http://127.0.0.1:9000";
    },
    get accessKey() {
        return process.env.MINIO_ACCESS_KEY ?? "minioadmin";
    },
    get secretKey() {
        return process.env.MINIO_SECRET_KEY ?? "minioadmin";
    },
    get bucket() {
        return process.env.MINIO_BUCKET ?? "attachments";
    },
    get region() {
        return process.env.MINIO_REGION ?? "us-east-1";
    },
};

let client: S3Client | undefined;
let bucketReady: Promise<void> | undefined;

export function getStorageClient(): S3Client {
    if (!client) {
        client = new S3Client({
            endpoint: storageConfig.endpoint,
            region: storageConfig.region,
            credentials: {
                accessKeyId: storageConfig.accessKey,
                secretAccessKey: storageConfig.secretKey,
            },
            forcePathStyle: true,
        });
    }
    return client;
}

async function ensureBucket(): Promise<void> {
    if (!bucketReady) {
        bucketReady = (async () => {
            const s3 = getStorageClient();
            const bucket = storageConfig.bucket;

            try {
                await s3.send(new HeadBucketCommand({ Bucket: bucket }));
            } catch {
                await s3.send(new CreateBucketCommand({ Bucket: bucket }));
            }
        })().catch((err) => {
            bucketReady = undefined;
            throw err;
        });
    }

    await bucketReady;
}

export async function putAttachmentObject(params: {
    key: string;
    body: Buffer;
    contentType: string;
}): Promise<string> {
    await ensureBucket();

    await getStorageClient().send(
        new PutObjectCommand({
            Bucket: storageConfig.bucket,
            Key: params.key,
            Body: params.body,
            ContentType: params.contentType,
        })
    );

    return params.key;
}

export function buildAttachmentStorageKey(parts: {
    userId: string;
    emailId: string;
    providerAttachmentId: string;
    filename: string;
}): string {
    const safeName = parts.filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180) || "file";
    return `attachments/${parts.userId}/${parts.emailId}/${parts.providerAttachmentId}/${safeName}`;
}
