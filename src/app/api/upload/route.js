import { createHash, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { apiError, requestIp } from '@/lib/http';
import { checkRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
const allowedTypes = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to upload evidence.', 401);
    const rate = await checkRateLimit(`upload:${session.user.id}:${requestIp(request)}`, { limit: 20, windowMs: 60 * 60_000 });
    if (!rate.allowed) return apiError('Upload limit reached. Please try again later.', 429);

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') return apiError('Choose an image to upload.', 400);
    if (!allowedTypes.has(file.type)) return apiError('Only JPEG, PNG, and WebP images are supported.', 400);
    if (file.size > MAX_BYTES) return apiError('Images must be 4 MB or smaller.', 413);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesFileSignature(buffer, file.type)) return apiError('The uploaded file does not match its image type.', 400);

    const cloudinary = cloudinaryConfig();
    if (cloudinary) {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = 'samvid/reports';
      const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${cloudinary.apiSecret}`).digest('hex');
      const uploadBody = new FormData();
      uploadBody.append('file', new Blob([buffer], { type: file.type }), `${randomUUID()}.${allowedTypes.get(file.type)}`);
      uploadBody.append('api_key', cloudinary.apiKey);
      uploadBody.append('timestamp', String(timestamp));
      uploadBody.append('folder', folder);
      uploadBody.append('signature', signature);
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`, { method: 'POST', body: uploadBody });
      const uploaded = await uploadResponse.json();
      if (!uploadResponse.ok || !uploaded.secure_url) throw new Error(uploaded.error?.message || 'Cloud upload failed');
      return NextResponse.json({ url: uploaded.secure_url });
    }

    if (process.env.NODE_ENV === 'production') return apiError('Image storage is not configured.', 503);
    const filename = `${randomUUID()}.${allowedTypes.get(file.type)}`;
    const uploadDirectory = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, filename), buffer, { flag: 'wx' });
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Image upload failed:', error);
    return apiError('Unable to upload this image.', 500);
  }
}

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

function matchesFileSignature(buffer, type) {
  if (type === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  if (type === 'image/webp') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
  return false;
}
