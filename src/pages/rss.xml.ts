import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '@/config/site';
import { isPublished } from '@/utils/collections';

type FeedItem = {
  title: string;
  description: string;
  pubDate: Date;
  link: string;
};

export async function GET(context: APIContext) {
  const notes = (await getCollection('notes')).filter(isPublished);
  const journal = (await getCollection('journal')).filter(isPublished);
  const items: FeedItem[] = [
    ...notes.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: `/notes/${entry.id}/`,
    })),
    ...journal.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: `/journal/${entry.id}/`,
    })),
  ].sort((a, b) => {
    const byDate = b.pubDate.valueOf() - a.pubDate.valueOf();
    return byDate === 0 ? a.link.localeCompare(b.link) : byDate;
  });

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? new URL(site.url),
    customData: '<language>zh-CN</language>',
    items,
  });
}
