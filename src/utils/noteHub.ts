import type { CollectionEntry } from 'astro:content';
import type { NoteTopic, NoteTopicDomain } from '@/config/noteTopics';
import { noteTopicDomains } from '@/config/noteTopics';
import type { SiteLanguage } from '@/config/site';
import { contentSlug, localizedContentHref, localizedPath } from './i18n.ts';

export interface NoteTopicEntryView {
  title: string;
  description: string;
  date: Date;
  href: string;
  slug: string;
}

export interface NoteTopicView extends NoteTopic {
  localizedTitle: string;
  localizedDescription: string;
  href: string;
  slug: string;
  count: number;
  latestDate: Date;
  entries: NoteTopicEntryView[];
  featuredEntries: NoteTopicEntryView[];
}

export interface NoteTopicDomainView extends NoteTopicDomain {
  localizedTitle: string;
  localizedDescription: string;
  articleCount: number;
  topics: NoteTopicView[];
}

export function buildNoteTopicDomains(
  entries: CollectionEntry<'notes'>[],
  lang: SiteLanguage,
): NoteTopicDomainView[] {
  return noteTopicDomains
    .map((domain) => {
      const topics = domain.topics
        .map((topic) => buildTopicView(entries, topic, lang))
        .filter((topic): topic is NoteTopicView => Boolean(topic));

      return {
        ...domain,
        localizedTitle: domain.title[lang],
        localizedDescription: domain.description[lang],
        articleCount: topics.reduce((total, topic) => total + topic.count, 0),
        topics,
      };
    })
    .filter((domain) => domain.topics.length > 0);
}

export function prefixToTopicSlug(prefix: string): string {
  return prefix.replace(/\/+$/, '');
}

export function localizedNoteTopicHref(prefix: string, lang: SiteLanguage): string {
  return localizedPath(`/notes/${prefixToTopicSlug(prefix)}/`, lang);
}

function buildTopicView(
  entries: CollectionEntry<'notes'>[],
  topic: NoteTopic,
  lang: SiteLanguage,
): NoteTopicView | undefined {
  const topicEntries = entries.filter((entry) => contentSlug(entry).startsWith(topic.prefix));

  if (topicEntries.length === 0) {
    return undefined;
  }

  const featuredEntries = pickFeaturedEntries(topicEntries, topic.featuredTranslationKeys, lang);
  const topicEntryViews = topicEntries.map((entry) => topicEntryView(entry, lang));

  return {
    ...topic,
    localizedTitle: topic.title[lang],
    localizedDescription: topic.description[lang],
    href: localizedNoteTopicHref(topic.prefix, lang),
    slug: prefixToTopicSlug(topic.prefix),
    count: topicEntries.length,
    latestDate: latestDate(topicEntries),
    entries: topicEntryViews,
    featuredEntries,
  };
}

function pickFeaturedEntries(
  entries: CollectionEntry<'notes'>[],
  featuredTranslationKeys: string[],
  lang: SiteLanguage,
): NoteTopicEntryView[] {
  const bySlug = new Map(entries.map((entry) => [contentSlug(entry), entry]));
  const picked = featuredTranslationKeys
    .map((slug) => bySlug.get(slug))
    .filter((entry): entry is CollectionEntry<'notes'> => Boolean(entry));
  const pickedSlugs = new Set(picked.map((entry) => contentSlug(entry)));
  const fallback = entries.filter((entry) => !pickedSlugs.has(contentSlug(entry)));

  return [...picked, ...fallback].slice(0, 4).map((entry) => topicEntryView(entry, lang));
}

function topicEntryView(entry: CollectionEntry<'notes'>, lang: SiteLanguage): NoteTopicEntryView {
  return {
    title: entry.data.title,
    description: entry.data.description,
    date: entry.data.date,
    href: localizedContentHref('notes', entry, lang),
    slug: contentSlug(entry),
  };
}

function latestDate(entries: CollectionEntry<'notes'>[]): Date {
  return entries.reduce((latest, entry) => (entry.data.date > latest ? entry.data.date : latest), entries[0].data.date);
}
