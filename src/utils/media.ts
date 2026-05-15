export type MediaType = 'image' | 'video';

export interface MediaItem {
  type: MediaType;
  src: string;
  alt?: string;
  caption?: string;
  poster?: string;
  title?: string;
}

export type MediaItemInput = Partial<MediaItem> & {
  src?: string;
};

const absoluteUrlPattern = /^[a-z][a-z0-9+.-]*:\/\//i;

export function configuredMediaBaseUrl() {
  const env = import.meta.env as Record<string, string | undefined> | undefined;
  return env?.PUBLIC_MEDIA_BASE_URL ?? '';
}

export function resolveMediaSrc(src: string | undefined, baseUrl = configuredMediaBaseUrl()) {
  const value = src?.trim() ?? '';

  if (!value) {
    return '';
  }

  if (absoluteUrlPattern.test(value) || value.startsWith('/')) {
    return value;
  }

  const key = value.replace(/^r2:\/+/i, '').replace(/^\/+/, '');
  const base = baseUrl.trim().replace(/\/+$/, '');

  if (!base) {
    return key;
  }

  return `${base}/${key}`;
}

export function normalizeMediaItems(media: MediaItemInput[] = [], legacyImages: string[] = []) {
  const structuredItems = media
    .map((item) => normalizeMediaItem(item))
    .filter((item): item is MediaItem => item !== undefined);

  const legacyItems = legacyImages
    .map((src) => src.trim())
    .filter(Boolean)
    .map((src) => ({ type: 'image' as const, src, alt: '' }));

  return [...structuredItems, ...legacyItems];
}

export function mediaMimeType(src: string) {
  const path = src.split(/[?#]/, 1)[0].toLowerCase();

  if (path.endsWith('.mp4')) {
    return 'video/mp4';
  }

  if (path.endsWith('.webm')) {
    return 'video/webm';
  }

  return undefined;
}

function normalizeMediaItem(item: MediaItemInput) {
  const src = item.src?.trim() ?? '';

  if (!src) {
    return undefined;
  }

  const type = item.type === 'video' ? 'video' : 'image';
  const normalized: MediaItem = { type, src };

  if (item.alt) {
    normalized.alt = item.alt;
  }

  if (item.caption) {
    normalized.caption = item.caption;
  }

  if (item.poster) {
    normalized.poster = item.poster;
  }

  if (item.title) {
    normalized.title = item.title;
  }

  return normalized;
}
