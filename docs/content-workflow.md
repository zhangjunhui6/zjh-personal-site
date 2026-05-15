# 内容后台使用手册

这个手册用于日常通过 Keystatic 维护内容，并保证提交后能顺利发布到 Cloudflare Pages。

## 后台入口

- 本地后台：`http://127.0.0.1:4321/keystatic` 或当前 Astro dev server 输出的端口。
- 线上后台：`https://zjh-personal-site.pages.dev/keystatic`
- 本地启动：`npm run dev`

线上后台使用 GitHub 模式，保存内容会进入仓库提交或分支流程。不要在后台里提交密钥、私人凭据或未确认可公开的信息。

## 推荐工作流

### 本地写作

适合长文、技术文章、项目复盘和需要反复调整结构的内容。

1. 运行 `npm run dev`。
2. 打开本地后台或直接编辑 `src/content` 下的 Markdown。
3. 先用 `Draft` 保存草稿。
4. 在浏览器里检查正文、列表、代码块、目录和标签。
5. 发布前取消 `Draft`。
6. 提交前运行本手册末尾的检查命令。

### 线上后台小改

适合修正错别字、补链接、改摘要、补标签等低风险内容。

1. 打开线上后台。
2. 找到对应 collection 和内容。
3. 修改后保存到 GitHub。
4. 等 CI 和 Cloudflare Pages 部署完成。
5. 打开线上页面确认。

长文结构调整建议仍在本地做，因为本地可以更快看浏览器效果，也更容易 review diff。

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

## 标题、slug 和摘要

标题承担两个任务：让读者愿意点开，也让自己以后能找回。技术文章标题尽量有画面或判断，不要只写成“Git 教程”“Docker 总结”。项目标题要表达项目价值，而不是只写技术名词。

推荐：

- `让每次修改都有来路：Git 的日常开发指南`
- `把环境装进箱子：Docker 的日常开发指南`
- `把个人网站做成长期内容系统`

不推荐：

- `Git 基础`
- `Docker 笔记`
- `个人网站项目`

slug 一旦公开后尽量稳定。标题如果只是润色，优先不要改 slug；如果后台自动根据标题改了文件名，提交前要检查 URL 是否变化。

摘要用来回答“这篇内容为什么值得打开”。建议写成一句完整描述，少用空泛词。

## Markdown 写作规范

正文尽量保持普通 Markdown 结构，让浏览器渲染结果和 `.md` 文件结构一致。

- 一级标题由页面标题提供，正文从 `##` 开始。
- 技术长文优先使用 `##` 做主章节，`###` 做小节。
- 列表就写标准 Markdown 列表，不用手动写数字或符号装饰。
- 命令、文件名、字段名使用 inline code。
- 多行命令和配置使用 fenced code block，并标明语言。
- 文章开头先说明问题和读者能得到什么，再进入概念或命令。

推荐结构：

```md
开头说明：这篇内容解决什么问题。

## 背景或目标

## 核心概念

## 常见场景

## 具体做法

## 常见坑

## 参考资料
```

## 标签规范

标签应该帮助聚合内容，不要变成一次性关键词。

优先使用已经存在的标签：

- `Git`
- `Docker`
- `开发流程`
- `工具`
- `个人网站`
- `写作`
- `网站`
- `生活`
- `观察`
- `记录`

新增标签前先问两个问题：

1. 未来是否可能有三篇以上内容使用它。
2. 它和已有标签是否只是同义词或大小写差异。

英文技术名词保持常见写法，例如 `Git`、`Docker`、`Astro`。中文主题使用简短名词，例如 `开发流程`、`个人网站`。

## Notes 专属字段

- `Updated`：内容有实质更新时填写。
- `Pinned`：只影响 `/notes/` 列表置顶，不影响标签页和归档页排序。
- `Cover`：详情页封面图。可以填写 `/images/...` 本地路径、Cloudinary 完整 URL，或以后启用的 R2 key。启用 Cloudinary 环境变量后，也可以在 Keystatic 字段里直接上传图片。
- `Media`：详情页正文后的图片或短视频列表。第一版优先用 `public/` 本地文件或 Cloudinary URL。

## Journal 专属字段

- `Mood`：当天情绪或语气，可留空。
- `Location`：地点，可留空。
- `Images`：旧图片 URL 列表，前台仍会展示；新内容优先使用 `Media`。
- `Media`：图片或短视频列表，支持 caption、alt、video poster。

## Projects 专属字段

- `Status`：`active`、`paused`、`finished`、`archive`。
- `Stack`：技术栈或工具关键词。
- `Links`：外部链接，必须是完整 URL。
- `Featured`：勾选后会进入首页精选项目。
- `Cover`：详情页封面图。
- `Media`：项目截图、演示视频或补充图集。

## 媒体字段

媒体文件第一版优先用两种方式：小图片和短视频放在仓库 `public/` 下；不想进 Git 或稍大的媒体放到 Cloudinary 免费版。R2 能力保留为以后可选，不影响当前工作流。

推荐路径：

```text
public/images/notes/<slug>/cover.webp
public/images/journal/<slug>/001.webp
public/videos/projects/<slug>/demo.mp4
public/videos/projects/<slug>/demo-poster.webp
```

可填写的 `Source` 形式：

- `/images/notes/demo/cover.webp`
- `/videos/projects/demo/demo.mp4`
- `https://res.cloudinary.com/<cloud-name>/image/upload/.../cover.webp`
- `/images/robotics/vla/openvla-architecture.svg`

以后如果启用 R2，也可以填写 `images/notes/demo/cover.webp` 或 `r2:/videos/projects/demo/demo.mp4`，并通过 `PUBLIC_MEDIA_BASE_URL` 解析。

Cloudinary 推荐工作流是在 Keystatic 的 `Cover` 或 `Media > Source` 字段里点击上传。浏览器会直接上传到 Cloudinary，上传成功后字段会自动写入 `secure_url`。

短视频只使用已经压缩好的 `.mp4` 或 `.webm`，并尽量填写 `Video poster`。长视频优先放到视频平台或 Cloudinary，不建议进仓库。

## 内容模板

可直接参考这些模板：

- 技术文章：`docs/content-templates/technical-note.md`
- 项目复盘：`docs/content-templates/project-case-study.md`
- 生活记录：`docs/content-templates/journal-entry.md`

模板不是必须完全照抄。它们的作用是帮你快速确定结构，避免每次从空白页开始。

## 发布前检查

本地提交前建议运行：

```bash
npm test
npm run check
npm run build
```

检查页面：

- `/notes/`：Notes 列表是否显示正确。
- `/journal/`：Journal 列表是否显示正确。
- `/tags/`：公开 Notes 和 Journal 的标签是否出现。
- `/archive/`：公开 Notes 和 Journal 是否按年份归档。
- 具体文章页：标签是否可以点击进入对应标签页。
- 技术长文：目录是否显示，列表和代码块是否按 Markdown 结构渲染。
- 项目页：标题、摘要、技术栈和正文 case study 是否互相匹配。

## 常见修正

- 内容不出现在前台：先检查 `Draft` 是否被勾选，再检查日期和保存分支是否已经合并部署。
- 标签重复：优先统一大小写、空格和中文/英文写法，例如只使用 `个人网站`。
- 页面构建失败：先看 CI 的 `Run Astro check` 和 `Build site` 日志，通常是字段格式、日期、URL 或 Markdown 语法问题。
- 标题改动导致 URL 变化：确认旧链接是否仍可接受；如果已经公开传播，优先新建内容或后续补 redirect。
- 目录没有出现：正文里至少需要两个 `##` 或 `###` 标题；短内容不会强制显示目录。
- 代码块样式异常：检查 fenced code block 是否用三个反引号包住，并确认没有把列表缩进误写进代码块。
