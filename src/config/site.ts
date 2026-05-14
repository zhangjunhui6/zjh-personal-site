export const site = {
  name: 'ZJH',
  title: 'ZJH 的个人空间',
  description: '一个长期记录技术、生活、项目和想法的个人网站。',
  url: 'https://zjh-personal-site.pages.dev',
  author: 'ZJH',
  defaultLang: 'zh',
  languages: ['zh', 'en'] as const,
  nav: [
    { label: '首页', href: '/' },
    { label: '记录', href: '/notes/' },
    { label: '生活', href: '/journal/' },
    { label: '项目', href: '/projects/' },
    { label: '归档', href: '/archive/' },
    { label: '关于', href: '/about/' },
  ],
};

export type SiteLanguage = (typeof site.languages)[number];
