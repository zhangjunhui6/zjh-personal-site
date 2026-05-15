import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const baseEntry = {
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  lang: z.enum(['zh', 'en']).default('zh'),
  translationKey: z.string().optional(),
  draft: z.boolean().default(false),
};

const mediaItem = z.object({
  type: z.enum(['image', 'video']).default('image'),
  src: z.string(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  poster: z.string().optional(),
  title: z.string().optional(),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...baseEntry,
    updated: z.coerce.date().optional(),
    pinned: z.boolean().default(false),
    cover: z.string().optional(),
    media: z.array(mediaItem).default([]),
  }),
});

const journal = defineCollection({
  loader: glob({ base: './src/content/journal', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...baseEntry,
    mood: z.string().optional(),
    location: z.string().optional(),
    images: z.array(z.string()).default([]),
    media: z.array(mediaItem).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    status: z.enum(['active', 'paused', 'finished', 'archive']).default('active'),
    stack: z.array(z.string()).default([]),
    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.string().url(),
        }),
      )
      .default([]),
    cover: z.string().optional(),
    media: z.array(mediaItem).default([]),
    featured: z.boolean().default(false),
    lang: z.enum(['zh', 'en']).default('zh'),
    translationKey: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes, journal, projects };
