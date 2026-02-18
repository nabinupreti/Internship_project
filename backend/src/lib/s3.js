import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client = null;

function getS3Client() {
  if (!process.env.S3_REGION) {
    return null;
  }
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.S3_REGION,
      credentials: process.env.S3_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
          }
        : undefined
    });
  }
  return s3Client;
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadResumePdf({ userId, file }) {
  const bucket = process.env.S3_BUCKET;
  const client = getS3Client();

  if (!bucket || !client) {
    throw new Error('S3 is not configured.');
  }

  const safeName = sanitizeFilename(file.originalname || 'resume.pdf');
  const key = `resumes/${userId}/${Date.now()}-${safeName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/pdf'
    })
  );

  return key;
}

export async function getSignedResumeUrl(key) {
  const bucket = process.env.S3_BUCKET;
  const client = getS3Client();

  if (!bucket || !client || !key) {
    return null;
  }

  const expiresIn = Number.parseInt(process.env.S3_SIGNED_URL_EXPIRES || '600', 10);
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });

  return getSignedUrl(client, command, {
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : 600
  });
}
