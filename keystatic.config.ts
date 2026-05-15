import { collection, config, fields } from '@keystatic/core';
import { repoMediaField, repoMediaValueLabel } from './src/keystatic/repoMediaField';

const storageMode =
  [
    import.meta.env.PUBLIC_KEYSTATIC_STORAGE,
    import.meta.env.KEYSTATIC_STORAGE,
  ].find((value) => typeof value === 'string' && value.length > 0) ?? 'local';

if (storageMode !== 'local' && storageMode !== 'github') {
  throw new Error(
    'PUBLIC_KEYSTATIC_STORAGE or KEYSTATIC_STORAGE must be either "local" or "github".',
  );
}

const storage =
  storageMode === 'github'
    ? ({
        kind: 'github',
        repo: 'zhangjunhui6/zjh-personal-site',
      } as const)
    : ({ kind: 'local' } as const);

const langOptions = [
  { label: 'Chinese', value: 'zh' },
  { label: 'English', value: 'en' },
] as const;

const createMediaUploadField = (
  collectionName: 'journal' | 'notes' | 'projects',
  options: {
    label: string;
    description: string;
    accept: string;
    isRequired?: boolean;
  },
) =>
  repoMediaField({
    label: options.label,
    description: options.description,
    validation: options.isRequired ? { isRequired: true } : undefined,
    directory: `public/media/${collectionName}`,
    publicPath: `/media/${collectionName}`,
    accept: options.accept,
  });

const createCoverField = (collectionName: 'notes' | 'projects') =>
  createMediaUploadField(collectionName, {
    label: 'Cover',
    description: 'Paste a media URL, or choose an image to save with this entry.',
    accept: 'image/*',
  });

const createMediaSourceField = (collectionName: 'journal' | 'notes' | 'projects') =>
  createMediaUploadField(collectionName, {
    label: 'Source',
    description: 'Paste a media URL, or choose an image/video to save with this entry.',
    isRequired: true,
    accept: 'image/*,video/mp4,video/webm',
  });

const createMediaPosterField = (collectionName: 'journal' | 'notes' | 'projects') =>
  createMediaUploadField(collectionName, {
    label: 'Video poster',
    description: 'Optional image shown before video playback.',
    accept: 'image/*',
  });

const createJournalImageField = () =>
  createMediaUploadField('journal', {
    label: 'Image',
    description: 'Legacy journal image URL. New entries should prefer Media.',
    accept: 'image/*',
  });

const createMediaField = (collectionName: 'journal' | 'notes' | 'projects') =>
  fields.array(
    fields.object({
      type: fields.select({
        label: 'Type',
        options: [
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
        ],
        defaultValue: 'image',
      }),
      src: createMediaSourceField(collectionName),
      alt: fields.text({
        label: 'Alt text',
        description: 'Use for images. Keep empty only when the image is decorative.',
      }),
      caption: fields.text({
        label: 'Caption',
        multiline: true,
      }),
      poster: createMediaPosterField(collectionName),
      title: fields.text({
        label: 'Title',
        description: 'Optional accessible label for videos or media management.',
      }),
    }),
    {
      label: 'Media',
      itemLabel: (props) => repoMediaValueLabel(props.fields.src.value) || props.fields.title.value || 'Media item',
    },
  );

const baseEntryFields = {
  title: fields.slug({
    name: {
      label: 'Title',
      validation: { isRequired: true },
    },
  }),
  description: fields.text({
    label: 'Description',
    validation: { isRequired: true },
    multiline: true,
  }),
  date: fields.date({
    label: 'Date',
    defaultValue: { kind: 'today' },
    validation: { isRequired: true },
  }),
  tags: fields.array(fields.text({ label: 'Tag' }), {
    label: 'Tags',
    itemLabel: (props) => props.value,
  }),
  lang: fields.select({
    label: 'Language',
    options: langOptions,
    defaultValue: 'zh',
  }),
  translationKey: fields.text({
    label: 'Translation key',
    description: 'Shared stable key for translated versions of the same entry.',
  }),
  draft: fields.checkbox({
    label: 'Draft',
    defaultValue: false,
  }),
  content: fields.markdoc({
    label: 'Content',
    extension: 'md',
  }),
};

const contentFormat = {
  contentField: 'content',
} as const;

export default config({
  storage,
  ui: {
    brand: { name: 'ZJH Personal Site' },
  },
  collections: {
    notes: collection({
      label: 'Notes',
      path: 'src/content/notes/**',
      slugField: 'title',
      entryLayout: 'content',
      format: contentFormat,
      columns: ['title', 'date', 'draft', 'pinned'],
      schema: {
        ...baseEntryFields,
        updated: fields.date({ label: 'Updated' }),
        pinned: fields.checkbox({
          label: 'Pinned',
          defaultValue: false,
        }),
        cover: createCoverField('notes'),
        media: createMediaField('notes'),
      },
    }),
    journal: collection({
      label: 'Journal',
      path: 'src/content/journal/*',
      slugField: 'title',
      entryLayout: 'content',
      format: contentFormat,
      columns: ['title', 'date', 'draft'],
      schema: {
        ...baseEntryFields,
        mood: fields.text({ label: 'Mood' }),
        location: fields.text({ label: 'Location' }),
        images: fields.array(createJournalImageField(), {
          label: 'Images',
          itemLabel: (props) => repoMediaValueLabel(props.value),
        }),
        media: createMediaField('journal'),
      },
    }),
    projects: collection({
      label: 'Projects',
      path: 'src/content/projects/*',
      slugField: 'title',
      entryLayout: 'content',
      format: contentFormat,
      columns: ['title', 'date', 'status', 'featured'],
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            validation: { isRequired: true },
          },
        }),
        description: fields.text({
          label: 'Description',
          validation: { isRequired: true },
          multiline: true,
        }),
        date: fields.date({
          label: 'Date',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Paused', value: 'paused' },
            { label: 'Finished', value: 'finished' },
            { label: 'Archive', value: 'archive' },
          ],
          defaultValue: 'active',
        }),
        stack: fields.array(fields.text({ label: 'Technology' }), {
          label: 'Stack',
          itemLabel: (props) => props.value,
        }),
        links: fields.array(
          fields.object({
            label: fields.text({
              label: 'Label',
              validation: { isRequired: true },
            }),
            href: fields.url({
              label: 'URL',
              validation: { isRequired: true },
            }),
          }),
          {
            label: 'Links',
            itemLabel: (props) => props.fields.label.value,
          },
        ),
        cover: createCoverField('projects'),
        media: createMediaField('projects'),
        featured: fields.checkbox({
          label: 'Featured',
          defaultValue: false,
        }),
        lang: fields.select({
          label: 'Language',
          options: langOptions,
          defaultValue: 'zh',
        }),
        translationKey: fields.text({
          label: 'Translation key',
          description: 'Shared stable key for translated versions of the same project.',
        }),
        draft: fields.checkbox({
          label: 'Draft',
          defaultValue: false,
        }),
        content: fields.markdoc({
          label: 'Content',
          extension: 'md',
        }),
      },
    }),
  },
});
