import { Storage } from '@google-cloud/storage';
import { randomUUID } from 'crypto';

const storage = new Storage();

export async function uploadImage(filePath: string, fileName: string): Promise<string> {
  const bucket = storage.bucket(process.env.GCS_BUCKET as string);
  const destination = `${randomUUID()}-${fileName}`;
  await bucket.upload(filePath, { destination, public: true });
  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}
