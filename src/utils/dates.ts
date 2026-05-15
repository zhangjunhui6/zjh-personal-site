import type { SiteLanguage } from '@/config/site';

const dateLocales: Record<SiteLanguage, string> = {
  zh: 'zh-CN',
  en: 'en-US',
};

export function formatDate(date: Date, lang: SiteLanguage = 'zh'): string {
  return new Intl.DateTimeFormat(dateLocales[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
