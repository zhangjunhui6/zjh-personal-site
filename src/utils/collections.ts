import type { CollectionEntry } from 'astro:content';

type DatedEntry =
  | CollectionEntry<'notes'>
  | CollectionEntry<'journal'>
  | CollectionEntry<'projects'>;

export function isPublished<T extends DatedEntry>(entry: T): boolean {
  return entry.data.draft !== true;
}

export function newestFirst<T extends DatedEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const byDate = b.data.date.valueOf() - a.data.date.valueOf();
    return byDate === 0 ? a.id.localeCompare(b.id) : byDate;
  });
}

export function featuredProjects(entries: CollectionEntry<'projects'>[]): CollectionEntry<'projects'>[] {
  return newestFirst(entries.filter((entry) => entry.data.featured && isPublished(entry)));
}
