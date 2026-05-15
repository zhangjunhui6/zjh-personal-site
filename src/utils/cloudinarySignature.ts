const CLOUDINARY_SIGNATURE_EXCLUDED_KEYS = new Set([
  'api_key',
  'cloud_name',
  'file',
  'resource_type',
  'signature',
]);

export type CloudinaryUploadParams = Record<string, string | number | boolean | null | undefined>;

export type CloudinaryUploadSignatureOptions = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
  resourceType?: unknown;
  now?: () => number;
};

export function sanitizeCloudinaryFolder(folder: string | null | undefined, fallback = 'personal-site/uploads') {
  const sanitized = String(folder ?? '')
    .split('/')
    .map((segment) =>
      segment
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^\.+|\.+$/g, '')
        .replace(/^-+|-+$/g, ''),
    )
    .filter(Boolean)
    .join('/')
    .slice(0, 120);

  return sanitized || fallback;
}

export function cloudinaryParamsToSign(params: CloudinaryUploadParams) {
  return Object.entries(params)
    .filter(([key, value]) => value !== undefined && value !== null && value !== '' && !CLOUDINARY_SIGNATURE_EXCLUDED_KEYS.has(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
}

export async function signCloudinaryUploadParams(params: CloudinaryUploadParams, apiSecret: string) {
  const payload = `${cloudinaryParamsToSign(params)}${apiSecret}`;
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-1', bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function isSupportedCloudinaryResourceType(resourceType: unknown) {
  return resourceType === 'image' || resourceType === 'video' || resourceType === 'auto';
}

export function normalizeCloudinaryResourceType(resourceType: unknown) {
  return isSupportedCloudinaryResourceType(resourceType) ? resourceType : 'auto';
}

export async function createCloudinaryUploadSignature(options: CloudinaryUploadSignatureOptions) {
  const resourceType = normalizeCloudinaryResourceType(options.resourceType);
  const timestamp = Math.floor((options.now?.() ?? Date.now()) / 1000).toString();
  const folder = sanitizeCloudinaryFolder(options.folder);
  const params = {
    folder,
    timestamp,
  };
  const signature = await signCloudinaryUploadParams(params, options.apiSecret);

  return {
    cloudName: options.cloudName,
    apiKey: options.apiKey,
    uploadUrl: `https://api.cloudinary.com/v1_1/${options.cloudName}/${resourceType}/upload`,
    params: {
      ...params,
      signature,
    },
  };
}
