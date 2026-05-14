import { getCollection } from 'astro:content';
import { isPublished } from '@/utils/collections';
import { createSearchDocument } from '@/utils/search';

export const prerender = true;

export async function GET() {
  const notes = (await getCollection('notes')).filter(isPublished);
  const journal = (await getCollection('journal')).filter(isPublished);
  const projects = (await getCollection('projects')).filter(isPublished);

  const items = [
    ...notes.map((entry) =>
      createSearchDocument({
        id: entry.id,
        collection: 'notes',
        title: entry.data.title,
        description: entry.data.description,
        date: entry.data.date.toISOString(),
        href: `/notes/${entry.id}/`,
        label: '记录',
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
        href: `/journal/${entry.id}/`,
        label: '生活',
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
        href: `/projects/${entry.id}/`,
        label: '项目',
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
