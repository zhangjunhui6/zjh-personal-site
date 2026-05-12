import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '@/config/site';
import { isPublished, newestFirst } from '@/utils/collections';

export async function GET(context: APIContext) {
  const notes = newestFirst((await getCollection('notes')).filter(isPublished));
  const journal = newestFirst((await getCollection('journal')).filter(isPublished));

  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? new URL(site.url),
    customData: '<language>zh-CN</language>',
    items: [
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
    ],
  });
}
