# Keystatic 自用后台设计文档

## 背景

当前个人网站已经部署到 Cloudflare Pages，线上地址为 `https://zjh-personal-site.pages.dev`。内容以 Astro Content Collections 管理，分别存放在：

- `src/content/notes`
- `src/content/journal`
- `src/content/projects`

每篇内容都是 frontmatter + Markdown 正文。这个结构适合接入 Git-based CMS：后台编辑内容，保存为仓库里的 Markdown 文件，推送到 GitHub 后由 Cloudflare Pages 自动重新构建。

## 目标

第一版后台只给站点所有者自己使用，目标是让内容创建和编辑变快，而不是建设一个多人 CMS 平台。

上线后的预期入口：

```text
https://zjh-personal-site.pages.dev/keystatic
```

能力范围：

- 在后台创建、编辑、删除 `notes` 内容。
- 在后台创建、编辑、删除 `journal` 内容。
- 在后台创建、编辑、删除 `projects` 内容。
- 编辑内容后写回 GitHub 仓库。
- Cloudflare Pages 通过 GitHub 提交自动重新部署。

暂不支持：

- 外部作者登录。
- 独立账号体系。
- 投稿审核流。
- 数据库存储。
- 图片媒体库的完整治理。
- 自定义域名。

## 权限模型

第一版使用 Keystatic 的 GitHub mode。访问者需要通过 GitHub 授权，并且需要对仓库 `zhangjunhui6/zjh-personal-site` 具备写入能力。

由于当前需求是“只给我自己用”，不向其他人授予 GitHub `write` 权限。这样可以避免外部用户直接拥有仓库写权限，也不需要额外实现投稿隔离、审核、回滚和权限管理。

后续如果要让别人参与写作，可以另行设计：

- GitHub Pull Request 投稿流。
- 独立表单投稿。
- Headless CMS 托管方案。
- 自建认证与审核系统。

这些都不进入第一版范围。

## 技术方案

采用 Keystatic + Astro + GitHub mode。

需要新增或调整的核心模块：

- `@keystatic/core`：定义后台字段、集合和 GitHub 存储。
- `@keystatic/astro`：在 Astro 中挂载 `/keystatic` 后台路由和所需 API。
- `@astrojs/react`：Keystatic Admin UI 需要 React。
- `@astrojs/cloudflare`：线上 `/keystatic` 需要服务端 API，Cloudflare Pages 需要通过 adapter 提供运行时能力。
- `astro@5.x`：`@keystatic/astro@5.0.6` 当前支持 Astro 2-5，第一版后台采用 Astro 5 兼容矩阵，而不是强行忽略 peer dependency。

Astro 配置需要从纯静态站升级为 Cloudflare 可运行的形式。实现时使用 Astro 5 的 `output: 'static'` 搭配 Cloudflare adapter；Astro 5 不再通过 `output: 'hybrid'` 表达混合渲染。公共内容页仍保持预渲染，避免为了后台把整站变成动态渲染页面。后台和后台 API 由 Keystatic integration 挂载，并由 Cloudflare Pages Functions 运行。

Cloudflare Pages 配置预计保持：

```text
Build command: npm run build
Output directory: dist
NODE_VERSION=22.16.0
```

并新增 Keystatic GitHub mode 需要的环境变量。具体变量以 Keystatic 创建 GitHub App 后生成的 `.env` 为准，预计包括：

```text
PUBLIC_KEYSTATIC_STORAGE
KEYSTATIC_STORAGE
KEYSTATIC_GITHUB_CLIENT_ID
KEYSTATIC_GITHUB_CLIENT_SECRET
KEYSTATIC_SECRET
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
```

这些密钥只配置到本地 `.env` 和 Cloudflare Pages 环境变量，不提交到仓库。`PUBLIC_KEYSTATIC_STORAGE` 不是密钥，用于让浏览器端 Keystatic Admin 知道当前是 `local` 还是 `github` 存储模式；生产环境设置为 `github`。

## 内容模型

后台需要与现有 `src/content.config.ts` 保持一致，避免后台保存的 Markdown 无法被 Astro 构建。

### Notes

路径：

```text
src/content/notes/*
```

字段：

- `title`：标题，作为 slug 来源。
- `description`：摘要。
- `date`：发布日期。
- `updated`：可选更新时间。
- `tags`：标签数组。
- `lang`：`zh` 或 `en`，默认 `zh`。
- `draft`：草稿开关，默认 `false`。
- `content`：Markdown 正文，写入同一个 `.md` 文件。

### Journal

路径：

```text
src/content/journal/*
```

字段：

- `title`：标题，作为 slug 来源。
- `description`：摘要。
- `date`：日期。
- `mood`：可选心情。
- `location`：可选地点。
- `images`：图片路径数组，第一版只作为文本数组维护。
- `tags`：标签数组。
- `lang`：`zh` 或 `en`，默认 `zh`。
- `draft`：草稿开关，默认 `false`。
- `content`：Markdown 正文，写入同一个 `.md` 文件。

### Projects

路径：

```text
src/content/projects/*
```

字段：

- `title`：标题，作为 slug 来源。
- `description`：摘要。
- `date`：日期。
- `status`：`active`、`paused`、`finished`、`archive`。
- `stack`：技术栈数组。
- `links`：链接数组，每项包含 `label` 和 `href`。
- `cover`：可选封面路径。
- `featured`：是否精选。
- `lang`：`zh` 或 `en`，默认 `zh`。
- `draft`：草稿开关，默认 `false`。
- `content`：Markdown 正文，写入同一个 `.md` 文件。

## 写入格式

现有内容使用 `.md` 文件。Keystatic 默认的 Markdoc/MDX 示例可能生成 `.mdoc` 或 `.mdx`，本项目第一版必须继续输出 `.md`，避免改动现有路由和构建逻辑。

后台正文使用 Keystatic 的可视化 Markdown/MDX 编辑字段，并配置为 `.md` 输出。内容需要避免 Keystatic 不支持的复杂 MDX import 和原始 HTML。第一版站点现有内容都是普通 Markdown，符合这个限制。

## 部署与环境

本地开发：

- 运行 `npm run dev`。
- 打开 `http://127.0.0.1:4321/keystatic`。
- 第一次在 GitHub mode 下完成 GitHub App 创建和授权。
- 本地 `.env` 保存 Keystatic 生成的密钥。

线上部署：

- 将 Keystatic 生成的环境变量添加到 Cloudflare Pages。
- 保持生产分支为 `main`。
- 推送后由 Cloudflare Pages 自动构建。
- 打开 `/keystatic`，用站点所有者 GitHub 账号登录。

Cloudflare adapter 风险：

- 站点会从纯静态部署升级为带 Pages Functions 的部署。
- 需要确认构建输出仍兼容 Cloudflare Pages。
- 需要确认首页、列表页、详情页、RSS、sitemap、404 仍能正常访问。
- 如 Cloudflare Workers runtime 对 Keystatic 的 Node API 支持不足，需要停下来评估替代方案，而不是硬改上线。

## 验收标准

本地验收：

- `npm run build` 通过。
- `npm ls vite @tailwindcss/vite astro` 确认 Astro 与 Vite 处于 Keystatic 兼容矩阵，预期为 Astro 5 与 Vite 6。
- 本地 `/keystatic` 能打开后台。
- 本地后台能读取现有 notes、journal、projects。
- 新建一篇草稿内容后生成正确 `.md` 文件。
- 删除测试草稿后工作区恢复干净。

线上验收：

- Cloudflare Pages 最新部署成功。
- `/`、`/notes/`、`/journal/`、`/projects/`、`/notes/start-here/`、`/rss.xml`、`/sitemap-index.xml` 返回 200。
- HTML canonical URL 仍指向 `https://zjh-personal-site.pages.dev`。
- `/keystatic` 能打开登录页。
- 站点所有者 GitHub 登录后能看到三类内容。
- 保存一条小改动或测试草稿后，GitHub 出现提交，Cloudflare 自动重新部署。

## 回滚策略

如果 Cloudflare adapter 或 Keystatic 线上运行不稳定：

- 回滚 Keystatic 相关依赖、`astro.config.mjs` 改动和 `keystatic.config.ts`。
- 保留当前 Markdown 内容结构不变。
- 将站点恢复为纯静态 Cloudflare Pages 部署。

如果只是 GitHub OAuth 或环境变量配置错误：

- 不回滚代码。
- 修正 GitHub App callback URL 和 Cloudflare Pages 环境变量。
- 重新部署验证。
