import type { CollectionEntry } from 'astro:content';
import type { SiteLanguage } from '../config/site.ts';

export const languageNames: Record<SiteLanguage, string> = {
  zh: '中文',
  en: 'English',
};

export const htmlLang: Record<SiteLanguage, string> = {
  zh: 'zh-CN',
  en: 'en',
};

export const uiText = {
  zh: {
    siteTitle: 'ZJH 的个人空间',
    siteDescription: '一个长期记录技术、生活、项目和想法的个人网站。',
    backHome: '返回首页',
    mainNav: '主导航',
    languageSwitch: '切换语言',
    footer: '用文字和小项目慢慢整理生活。',
    tocLabel: '文章目录',
    tocTitle: '本文目录',
    searchSubmit: '搜索',
    searchHint: '按标题、标签和正文检索，回车直接查看结果。',
    searchScopeAll: '全站',
    collectionLabels: {
      notes: '记录',
      journal: '生活',
      projects: '项目',
    },
    nav: [
      { label: '首页', href: '/' },
      { label: '记录', href: '/notes/' },
      { label: '生活', href: '/journal/' },
      { label: '项目', href: '/projects/' },
      { label: '归档', href: '/archive/' },
      { label: '搜索', href: '/search/' },
      { label: '关于', href: '/about/' },
    ],
    projectStatus: {
      active: '进行中',
      paused: '暂停',
      finished: '已完成',
      archive: '归档',
    },
  },
  en: {
    siteTitle: "ZJH's Personal Space",
    siteDescription: 'A long-running personal site for technology, life, projects, and ideas.',
    backHome: 'Back to home',
    mainNav: 'Main navigation',
    languageSwitch: 'Switch language',
    footer: 'Organizing life slowly through writing and small projects.',
    tocLabel: 'Article contents',
    tocTitle: 'Contents',
    searchSubmit: 'Search',
    searchHint: 'Search titles, tags, and body text. Press Enter to view results.',
    searchScopeAll: 'All',
    collectionLabels: {
      notes: 'Notes',
      journal: 'Journal',
      projects: 'Projects',
    },
    nav: [
      { label: 'Home', href: '/' },
      { label: 'Notes', href: '/notes/' },
      { label: 'Journal', href: '/journal/' },
      { label: 'Projects', href: '/projects/' },
      { label: 'Archive', href: '/archive/' },
      { label: 'Search', href: '/search/' },
      { label: 'About', href: '/about/' },
    ],
    projectStatus: {
      active: 'Active',
      paused: 'Paused',
      finished: 'Finished',
      archive: 'Archived',
    },
  },
} as const;

export function getLanguageFromPathname(pathname: string): SiteLanguage {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'zh';
}

export function localizedPath(pathname: string, lang: SiteLanguage): string {
  const withoutEnglishPrefix = stripEnglishPrefix(pathname);

  if (lang === 'zh') {
    return withoutEnglishPrefix || '/';
  }

  if (withoutEnglishPrefix === '/') {
    return '/en/';
  }

  return `/en${withoutEnglishPrefix}`;
}

export function alternateLanguage(lang: SiteLanguage): SiteLanguage {
  return lang === 'zh' ? 'en' : 'zh';
}

export function entriesForLanguage<T extends { data: { lang?: SiteLanguage } }>(
  entries: T[],
  lang: SiteLanguage,
): T[] {
  return entries.filter((entry) => (entry.data.lang ?? 'zh') === lang);
}

type ContentEntry =
  | CollectionEntry<'notes'>
  | CollectionEntry<'journal'>
  | CollectionEntry<'projects'>
  | { id: string; data: { translationKey?: string } };

export function contentSlug(entry: ContentEntry): string {
  return entry.data.translationKey?.trim() || entry.id.replace(/-en$/, '');
}

export function localizedContentHref(
  collection: 'notes' | 'journal' | 'projects',
  entry: ContentEntry,
  lang: SiteLanguage,
): string {
  return localizedPath(`/${collection}/${contentSlug(entry)}/`, lang);
}

function stripEnglishPrefix(pathname: string): string {
  if (pathname === '/en') {
    return '/';
  }

  if (pathname.startsWith('/en/')) {
    return pathname.slice(3) || '/';
  }

  return pathname || '/';
}
