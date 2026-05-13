# 内容后台验收与轻量编辑体验优化设计

## 背景

个人网站已经完成 Astro 静态站点、GitHub 仓库、Cloudflare Pages 部署和 Keystatic 后台接入。下一步目标不是增加复杂系统，而是确认后台真实发布链路可靠，并把内容字段整理成长期写作时顺手的最小集合。

当前内容仍以 Markdown 存储在 Git 仓库中，Keystatic 负责后台编辑，Cloudflare Pages 负责自动部署。暂不引入数据库，避免为了少等部署时间提前增加运行时复杂度。

## 目标

1. 用一篇正式 Notes 内容验收后台发布链路。
2. 优化 Notes、Journal、Projects 的后台字段，让日常编辑更直觉。
3. 同步 Astro 内容 schema 与页面读取逻辑，避免后台可填但前台不可用。
4. 保持静态站点发布模型：内容保存到 GitHub 后由 Cloudflare 自动部署。

## 非目标

1. 不接入数据库。
2. 不重做视觉设计和首页结构。
3. 不增加多人权限、评论、点赞、访问统计等动态功能。
4. 不引入图片上传系统；本轮只保留图片路径/URL 字段。

## 后台发布验收

新建一篇正式 Notes 文章：

- 标题：让这个个人网站开始运转
- 栏目：Notes
- slug：`start-the-site`
- 状态：非草稿
- 内容定位：自然的开场说明，说明这个网站将如何记录想法、项目和生活观察，不写成测试文。

验收链路：

1. 在 Keystatic 后台新建并保存文章。
2. 确认 GitHub `main` 分支出现新 commit。
3. 确认 Cloudflare Pages 生产部署变为 Active。
4. 访问 `/notes/` 能看到文章。
5. 访问文章详情页能看到正文和正确 canonical URL。

## 内容字段模型

### Notes

Notes 面向相对完整的记录和文章。本轮字段：

- `title`：必填，作为页面标题和 slug 来源。
- `description`：必填，用于列表摘要、SEO 描述和 RSS。
- `date`：必填，代表首次发布或主要写作日期。
- `updated`：可选，代表最近实质更新日期。
- `tags`：可选数组，用于后续标签页和内容归类。
- `pinned`：布尔值，默认为 `false`，用于列表置顶。
- `cover`：可选字符串，暂存图片路径或 URL。
- `lang`：默认 `zh`。
- `draft`：布尔值，默认为 `false`。
- `content`：Markdown 正文。

### Journal

Journal 面向轻量生活记录。本轮保持克制：

- 继承基础字段：`title`、`description`、`date`、`tags`、`lang`、`draft`、`content`。
- `mood`：可选，记录当时状态。
- `location`：可选，记录地点。
- `images`：可选数组，暂存图片路径或 URL。

Journal 本轮不增加 `pinned`，避免生活流被过度运营化。

### Projects

Projects 面向作品和项目展示。本轮字段：

- `title`、`description`、`date`、`lang`、`draft`、`content`。
- `status`：`active`、`paused`、`finished`、`archive`。
- `stack`：技术栈数组。
- `links`：外链数组，每项包含 `label` 和 `href`。
- `cover`：可选字符串，暂存展示图路径或 URL。
- `featured`：布尔值，默认为 `false`，用于首页或项目页精选。

## 前台读取与排序

1. 所有列表继续过滤 `draft: true` 内容。
2. Notes 列表排序：`pinned: true` 优先，其次按 `date` 新到旧，日期相同则按 id 排序。
3. Journal 列表保持按 `date` 新到旧。
4. Projects 精选继续使用 `featured: true`，整体项目列表按 `date` 新到旧。
5. `updated` 本轮只在 Notes 详情页显示；列表页可暂不展示，避免信息过密。
6. `cover` 字段先进入 schema 和后台，不强制前台展示，为后续视觉升级预留。

## 错误处理

1. Keystatic 必填字段保留校验，避免生成缺少标题、描述或日期的内容。
2. Astro content schema 为新增字段设置默认值或 optional，保证旧内容无需一次性大迁移也能构建。
3. 外链继续使用 URL 校验，避免 Projects 链接保存为无效地址。
4. 如果后台保存触发 Cloudflare 部署失败，先查看 Cloudflare build log，再回滚或修正对应 commit。

## 测试计划

本地验证：

- `npm run check`
- `npm run build`
- `npm ls vite @tailwindcss/vite astro`

发布验证：

- Keystatic 后台能新建正式 Notes 内容。
- GitHub `main` 出现对应 commit。
- Cloudflare Pages 部署 Active。
- 访问 `/notes/`、新文章详情页、`/rss.xml`、`/sitemap-index.xml` 正常。
- 新文章页面源码包含正确 canonical URL。

## 交付标准

1. 设计文档已提交。
2. 实现计划覆盖字段 schema、Keystatic 配置、前台排序/展示、正式文章验收。
3. 实现完成后，站点仍保持静态优先、免费部署、Git 可回滚的工作流。
