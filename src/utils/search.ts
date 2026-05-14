export type SearchCollection = 'notes' | 'journal' | 'projects';
export type SearchFilter = SearchCollection | 'all';

export interface SearchDocument {
  id: string;
  collection: SearchCollection;
  title: string;
  description: string;
  date: string;
  href: string;
  label: string;
  tags: string[];
  body: string;
  searchText: string;
}

export type SearchDocumentInput = Omit<SearchDocument, 'searchText'> & {
  searchText?: string;
};

export interface SearchResult extends SearchDocument {
  score: number;
  excerpt: string;
}

const locale = 'zh-CN';

export function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase(locale).replace(/\s+/g, ' ').trim();
}

export function tokenizeSearchQuery(query: string): string[] {
  return normalizeSearchText(query).split(' ').filter(Boolean);
}

export function createSearchDocument(input: SearchDocumentInput): SearchDocument {
  const tags = uniqueTags(input.tags);

  return {
    ...input,
    tags,
    body: input.body ?? '',
    searchText:
      input.searchText ??
      normalizeSearchText([
        input.title,
        input.description,
        tags.join(' '),
        input.body,
      ].join(' ')),
  };
}

export function searchDocuments(
  documents: SearchDocumentInput[],
  query: string,
  filter: SearchFilter = 'all',
): SearchResult[] {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) return [];

  return documents
    .map(createSearchDocument)
    .filter((document) => filter === 'all' || document.collection === filter)
    .map((document) => {
      const score = scoreDocument(document, tokens);
      if (score === 0) return undefined;

      return {
        ...document,
        score,
        excerpt: createSearchExcerpt(document.body, query, document.description),
      };
    })
    .filter((result): result is SearchResult => result !== undefined)
    .sort((a, b) => {
      const byScore = b.score - a.score;
      if (byScore !== 0) return byScore;

      const byDate = new Date(b.date).valueOf() - new Date(a.date).valueOf();
      return byDate === 0 ? a.id.localeCompare(b.id) : byDate;
    });
}

export function createSearchExcerpt(
  text: string,
  query: string,
  fallback: string,
  maxLength = 120,
): string {
  const source = (text || fallback).replace(/\s+/g, ' ').trim();
  if (!source) return '';

  const tokens = tokenizeSearchQuery(query);
  const lowerSource = source.toLocaleLowerCase(locale);
  const matchIndex = tokens
    .map((token) => lowerSource.indexOf(token))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (matchIndex === undefined) {
    return truncateExcerpt(source, maxLength);
  }

  const start = Math.max(0, matchIndex - Math.floor(maxLength / 3));
  const end = Math.min(source.length, start + maxLength);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < source.length ? '...' : '';

  return `${prefix}${source.slice(start, end).trim()}${suffix}`;
}

function scoreDocument(document: SearchDocument, tokens: string[]): number {
  if (!tokens.every((token) => document.searchText.includes(token))) return 0;

  return tokens.reduce((score, token) => {
    const tagScore = document.tags.some((tag) => normalizeSearchText(tag) === token)
      ? 24
      : scoreField(document.tags.join(' '), token, 12);

    return (
      score +
      scoreField(document.title, token, 48) +
      tagScore +
      scoreField(document.description, token, 18) +
      scoreField(document.body, token, 4)
    );
  }, 0);
}

function scoreField(value: string, token: string, weight: number): number {
  return normalizeSearchText(value).includes(token) ? weight : 0;
}

function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalizedTags: string[] = [];

  for (const rawTag of tags) {
    const tag = rawTag.trim();
    if (!tag || seen.has(tag)) continue;

    seen.add(tag);
    normalizedTags.push(tag);
  }

  return normalizedTags;
}

function truncateExcerpt(source: string, maxLength: number): string {
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).trim()}...`;
}
