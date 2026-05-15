import { getCollection } from 'astro:content';
import { isPublished } from '@/utils/collections';
import { entriesForLanguage, localizedContentHref, uiText } from '@/utils/i18n';
import { createSearchDocument } from '@/utils/search';

export const prerender = true;

export async function GET() {
  const lang = 'en';
  const text = uiText[lang];
  const notes = entriesForLanguage((await getCollection('notes')).filter(isPublished), lang);
  const journal = entriesForLanguage((await getCollection('journal')).filter(isPublished), lang);
  const projects = entriesForLanguage((await getCollection('projects')).filter(isPublished), lang);

  const items = [
    ...notes.map((entry) =>
      createSearchDocument({
        id: entry.id,
        collection: 'notes',
        title: entry.data.title,
        description: entry.data.description,
        date: entry.data.date.toISOString(),
        href: localizedContentHref('notes', entry, lang),
        label: text.collectionLabels.notes,
        tags: entry.data.tags,
        body: entry.body ?? '',
      }),
    ),
    ...journal.map((entry) =>
      createSearchDocument({
        id: entry.id,
        collection: 'journal',
        title: entry.data.title,
        description: entry.data.description,
        date: entry.data.date.toISOString(),
        href: localizedContentHref('journal', entry, lang),
        label: text.collectionLabels.journal,
        tags: entry.data.tags,
        body: entry.body ?? '',
      }),
    ),
    ...projects.map((entry) =>
      createSearchDocument({
        id: entry.id,
        collection: 'projects',
        title: entry.data.title,
        description: entry.data.description,
        date: entry.data.date.toISOString(),
        href: localizedContentHref('projects', entry, lang),
        label: text.collectionLabels.projects,
        tags: entry.data.stack,
        body: entry.body ?? '',
      }),
    ),
  ].sort((a, b) => {
    const byDate = new Date(b.date).valueOf() - new Date(a.date).valueOf();
    return byDate === 0 ? a.id.localeCompare(b.id) : byDate;
  });

  return new Response(JSON.stringify({ items }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}
