
// src/lib/s3.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const getS3Client = (): S3Client => {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('Credenciais da AWS S3 não configuradas no ambiente.');
    }

    return new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });
}

const getBucket = (): string => {
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    if (!bucket) throw new Error("AWS_S3_BUCKET_NAME não configurado.");
    return bucket;
}

// Upload com presigned URL para melhor segurança
async function getPresignedUploadUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        ContentType: contentType,
    });
    return getSignedUrl(getS3Client(), command, { expiresIn });
}

// Upload direto (mantido para compatibilidade)
async function uploadFileToS3(key: string, body: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'max-age=31536000', // 1 ano
    });

    await getS3Client().send(command);
    return getFileUrl(key);
}

// URL segura com presigned URL
async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
    return getSignedUrl(getS3Client(), command, { expiresIn });
}

// URL pública (para CDN)
function getFileUrl(key: string): string {
    const cdnDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
    if (cdnDomain) return `https://${cdnDomain}/${key}`;
    return `https://${getBucket()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Deletar arquivo
async function deleteFileFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({ Bucket: getBucket(), Key: key });
    await getS3Client().send(command);
}

// Verificar se arquivo existe
async function fileExists(key: string): Promise<boolean> {
    try {
        await getS3Client().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
        return true;
    } catch {
        return false;
    }
}

// Stream para Meta (otimizado)
async function getFileStream(key: string): Promise<ReadableStream> {
    const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
    const response = await getS3Client().send(command);
    return response.Body as ReadableStream;
}

export { 
    getS3Client, 
    uploadFileToS3, 
    getPresignedUploadUrl,
    getPresignedDownloadUrl,
    getFileUrl,
    deleteFileFromS3,
    fileExists,
    getFileStream
};
