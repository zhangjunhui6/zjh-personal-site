# 内容后台使用手册

这个手册用于日常通过 Keystatic 维护内容，并保证提交后能顺利发布到 Cloudflare Pages。

## 后台入口

- 本地后台：`http://127.0.0.1:4321/keystatic`
- 线上后台：`https://zjh-personal-site.pages.dev/keystatic`
- 本地启动：`npm run dev`

线上后台使用 GitHub 模式，保存内容会进入仓库提交或分支流程。不要在后台里提交密钥、私人凭据或未确认可公开的信息。

## 内容类型怎么选

- `Notes`：相对完整的文章、技术笔记、读书想法、长期问题。会出现在 `/notes/`、标签页和归档页。
- `Journal`：轻量生活记录、散步、房间、旅行、观察。会出现在 `/journal/`、标签页和归档页。
- `Projects`：项目介绍、作品集条目、工具说明。会出现在 `/projects/`，暂不进入标签页和归档页。

## 通用字段

- `Title`：页面标题，也会生成文件 slug。保存后尽量不要频繁改标题，避免 URL 变化。
- `Description`：列表页和社交分享摘要。建议 20-80 个中文字符。
- `Date`：内容首次发布或主要记录日期。归档页按这个字段分组。
- `Tags`：主题标签。使用简短名词，如 `个人网站`、`写作`、`散步`。同一主题保持同一种写法。
- `Language`：默认 `zh`。
- `Draft`：勾选后不会出现在公开列表、标签页和归档页。
- `Content`：正文，使用 Markdown/Markdoc。

## Notes 专属字段

- `Updated`：内容有实质更新时填写。
- `Pinned`：只影响 `/notes/` 列表置顶，不影响标签页和归档页排序。
- `Cover`：预留封面字段。当前前台暂未渲染。

## Journal 专属字段

- `Mood`：当天情绪或语气，可留空。
- `Location`：地点，可留空。
- `Images`：图片 URL 列表。当前前台暂未做图库展示，添加前先确认图片可公开访问。

## Projects 专属字段

- `Status`：`active`、`paused`、`finished`、`archive`。
- `Stack`：技术栈或工具关键词。
- `Links`：外部链接，必须是完整 URL。
- `Featured`：勾选后会进入首页精选项目。
- `Cover`：预留封面字段。当前前台暂未渲染。

## 发布前检查

本地提交前建议运行：

```bash
npm test
node ./node_modules/.bin/astro check
node ./node_modules/.bin/astro build
```

检查页面：

- `/notes/`：Notes 列表是否显示正确。
- `/journal/`：Journal 列表是否显示正确。
- `/tags/`：公开 Notes 和 Journal 的标签是否出现。
- `/archive/`：公开 Notes 和 Journal 是否按年份归档。
- 具体文章页：标签是否可以点击进入对应标签页。

## 常见修正

- 内容不出现在前台：先检查 `Draft` 是否被勾选，再检查日期和保存分支是否已经合并部署。
- 标签重复：优先统一大小写、空格和中文/英文写法，例如只使用 `个人网站`。
- 页面构建失败：先看 CI 的 `Run Astro check` 和 `Build site` 日志，通常是字段格式、日期、URL 或 Markdown 语法问题。
- 标题改动导致 URL 变化：确认旧链接是否仍可接受；如果已经公开传播，优先新建内容或后续补 redirect。
