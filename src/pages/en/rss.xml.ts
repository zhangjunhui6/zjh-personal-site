import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '@/config/site';
import { isPublished } from '@/utils/collections';
import { entriesForLanguage, localizedContentHref, uiText } from '@/utils/i18n';

type FeedItem = {
  title: string;
  description: string;
  pubDate: Date;
  link: string;
};

export async function GET(context: APIContext) {
  const lang = 'en';
  const notes = entriesForLanguage((await getCollection('notes')).filter(isPublished), lang);
  const journal = entriesForLanguage((await getCollection('journal')).filter(isPublished), lang);
  const items: FeedItem[] = [
    ...notes.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: localizedContentHref('notes', entry, lang),
    })),
    ...journal.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.date,
      link: localizedContentHref('journal', entry, lang),
    })),
  ].sort((a, b) => {
    const byDate = b.pubDate.valueOf() - a.pubDate.valueOf();
    return byDate === 0 ? a.link.localeCompare(b.link) : byDate;
  });

  return rss({
    title: uiText[lang].siteTitle,
    description: uiText[lang].siteDescription,
    site: context.site ?? new URL(site.url),
    customData: '<language>en</language>',
    items,
  });
}
