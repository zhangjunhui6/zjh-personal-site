import type { APIContext } from 'astro';
import {
  createCloudinaryUploadSignature,
} from '@/utils/cloudinarySignature';

export const prerender = false;

type RuntimeEnv = Record<string, unknown>;

function getRuntimeEnv(locals: APIContext['locals']) {
  const cloudflareEnv = (locals as { runtime?: { env?: RuntimeEnv } }).runtime?.env ?? {};

  return {
    cloudName: stringEnv(cloudflareEnv.CLOUDINARY_CLOUD_NAME) ?? import.meta.env.CLOUDINARY_CLOUD_NAME,
    apiKey: stringEnv(cloudflareEnv.CLOUDINARY_API_KEY) ?? import.meta.env.CLOUDINARY_API_KEY,
    apiSecret: stringEnv(cloudflareEnv.CLOUDINARY_API_SECRET) ?? import.meta.env.CLOUDINARY_API_SECRET,
    uploadToken: stringEnv(cloudflareEnv.MEDIA_UPLOAD_TOKEN) ?? import.meta.env.MEDIA_UPLOAD_TOKEN,
  };
}

function stringEnv(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const [scheme, token] = authorization.split(/\s+/, 2);

  return scheme?.toLowerCase() === 'bearer' ? token : '';
}

function timingSafeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const maxLength = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return mismatch === 0;
}

export async function POST(context: APIContext) {
  const { request, locals } = context;
  const env = getRuntimeEnv(locals);

  if (!env.cloudName || !env.apiKey || !env.apiSecret || !env.uploadToken) {
    return jsonResponse({ error: 'Cloudinary upload environment variables are not configured.' }, 500);
  }

  if (!timingSafeEqual(bearerToken(request), env.uploadToken)) {
    return jsonResponse({ error: 'Invalid media upload token.' }, 401);
  }

  let body: { folder?: unknown; resourceType?: unknown };
  try {
    body = (await request.json()) as { folder?: unknown; resourceType?: unknown };
  } catch {
    return jsonResponse({ error: 'Request body must be JSON.' }, 400);
  }

  return jsonResponse(
    await createCloudinaryUploadSignature({
      cloudName: env.cloudName,
      apiKey: env.apiKey,
      apiSecret: env.apiSecret,
      folder: typeof body.folder === 'string' ? body.folder : undefined,
      resourceType: body.resourceType,
    }),
  );
}

export function GET() {
  return jsonResponse({ error: 'Method not allowed.' }, 405);
}
