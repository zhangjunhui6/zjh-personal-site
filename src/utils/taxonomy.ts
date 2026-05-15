import type { CollectionEntry } from 'astro:content';
import type { SiteLanguage } from '../config/site.ts';
import { contentSlug, localizedPath, uiText } from './i18n.ts';

export type TaggedCollection = 'notes' | 'journal';

export interface TaggedContentItem {
  id: string;
  collection: TaggedCollection;
  title: string;
  description: string;
  date: Date;
  tags: string[];
  href: string;
  label: string;
}

export interface TagSummary {
  tag: string;
  count: number;
  href: string;
}

export interface ArchiveYear {
  year: string;
  entries: TaggedContentItem[];
}

export function normalizeTag(tag: string): string {
  return tag.trim();
}

export function tagSlug(tag: string): string {
  return encodeURIComponent(normalizeTag(tag));
}

export function tagHref(tag: string, lang: SiteLanguage = 'zh'): string {
  return localizedPath(`/tags/${tagSlug(tag)}/`, lang);
}

export function toTaggedContentItems(
  notes: CollectionEntry<'notes'>[],
  journal: CollectionEntry<'journal'>[],
  lang: SiteLanguage = 'zh',
): TaggedContentItem[] {
  return sortNewestFirst([
    ...notes.map((entry) => ({
      id: entry.id,
      collection: 'notes' as const,
      title: entry.data.title,
      description: entry.data.description,
      date: entry.data.date,
      tags: entry.data.tags,
      href: localizedPath(`/notes/${contentSlug(entry)}/`, lang),
      label: uiText[lang].collectionLabels.notes,
    })),
    ...journal.map((entry) => ({
      id: entry.id,
      collection: 'journal' as const,
      title: entry.data.title,
      description: entry.data.description,
      date: entry.data.date,
      tags: entry.data.tags,
      href: localizedPath(`/journal/${contentSlug(entry)}/`, lang),
      label: uiText[lang].collectionLabels.journal,
    })),
  ]);
}

export function collectTagSummaries(items: TaggedContentItem[], lang: SiteLanguage = 'zh'): TagSummary[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const tag of uniqueNormalizedTags(item.tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count, href: tagHref(tag, lang) }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, lang === 'en' ? 'en-US' : 'zh-CN'));
}

export function filterItemsByTag(items: TaggedContentItem[], tag: string): TaggedContentItem[] {
  const normalizedTag = normalizeTag(tag);

  return sortNewestFirst(
    items.filter((item) => uniqueNormalizedTags(item.tags).includes(normalizedTag)),
  );
}

export function groupItemsByYear(items: TaggedContentItem[]): ArchiveYear[] {
  const groups = new Map<string, TaggedContentItem[]>();

  for (const item of sortNewestFirst(items)) {
    const year = String(item.date.getFullYear());
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }

  return [...groups.entries()]
    .map(([year, entries]) => ({ year, entries }))
    .sort((a, b) => Number(b.year) - Number(a.year));
}

function uniqueNormalizedTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalizedTags: string[] = [];

  for (const rawTag of tags) {
    const tag = normalizeTag(rawTag);
    if (!tag || seen.has(tag)) continue;

    seen.add(tag);
    normalizedTags.push(tag);
  }

  return normalizedTags;
}

function sortNewestFirst<T extends { id: string; date: Date }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const byDate = b.date.valueOf() - a.date.valueOf();
    return byDate === 0 ? a.id.localeCompare(b.id) : byDate;
  });
}
