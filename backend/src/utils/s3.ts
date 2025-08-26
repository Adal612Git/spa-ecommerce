import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import { randomUUID } from 'crypto';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function uploadImage(filePath: string, fileName: string): Promise<string> {
  const fileStream = fs.createReadStream(filePath);
  const Key = `${randomUUID()}-${fileName}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key,
      Body: fileStream,
      ACL: 'public-read',
    })
  );
  return `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${Key}`;
}
