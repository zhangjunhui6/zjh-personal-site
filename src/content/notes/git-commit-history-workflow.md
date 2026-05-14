---
title: 把 Git 提交历史整理清楚
description: 从分支命名、提交拆分到 rebase 清理，整理一套日常可用的 Git 工作流。
date: 2026-05-14
tags: [Git, 开发流程]
lang: zh
draft: false
---

Git 用久了以后，真正影响协作体验的往往不是某个高级命令，而是提交历史是否能让后来的人快速理解：这次改动为什么发生、改了什么、风险在哪里。

一个清楚的 Git 历史，像是一份随代码一起保存的开发记录。它不需要完美，但应该能回答三个问题：

- 这条分支解决了什么问题。
- 每个提交各自完成了什么独立变化。
- 如果线上出了问题，应该从哪一段历史开始回看。

## 先把分支当成一个工作单元

分支名不只是给自己看的临时名字。它最好能表达改动范围，例如：

```bash
git switch -c feature/search-page
git switch -c fix/rss-draft-filter
git switch -c content/git-workflow-note
```

我通常会让分支名包含两层信息：类型和主题。类型说明这是功能、修复、内容还是维护；主题说明它在改哪一块。这样打开远端分支列表时，不需要点进去就能大概知道它的用途。

## 提交应该按意图拆分

一个提交最好只表达一个完整意图。它不一定只改一个文件，但文件之间应该服务于同一个目的。

比如做一个搜索页时，可以拆成：

```text
feat: add search index helpers
feat: add search page
test: cover search ranking
```

比起一个巨大的 `feat: update site`，这种历史更容易 review，也更容易回滚。真正需要回滚时，你可以只撤掉某个具体提交，而不是把一整团混在一起的变化都拿掉。

拆提交时有一个很实用的判断：如果你很难用一句话说清这个提交做了什么，它可能就太大了。

## 写提交信息时说结果，不说过程

好的提交信息不是日记，不需要写“修改了一下文件”。它应该描述代码库获得了什么变化。

```text
feat: add archive page
fix: exclude draft entries from RSS
docs: document content publishing workflow
```

这里的动词都指向结果：新增了什么、修复了什么、记录了什么。以后看历史时，读者不用关心你当时试过哪些中间方案，只需要理解最后留下来的行为。

## 用 rebase 清理本地历史

在分支还没有被别人共同使用之前，可以用交互式 rebase 整理提交历史：

```bash
git rebase -i main
```

常见操作有三种：

- `pick`：保留提交。
- `reword`：只改提交信息。
- `squash`：把多个提交合并成一个。

例如你在开发过程中留下了几个修补提交：

```text
feat: add search page
fix typo
fix test
adjust style
```

合并前可以把后面几个修补提交 squash 到第一个提交里，让最终历史更像一个完成后的叙述，而不是完整记录每一次手抖。

需要注意的是，不要随意 rebase 已经被多人基于其继续开发的共享分支。rebase 会改写提交历史，对协作者来说等于地面突然移动。自己的功能分支可以整理，公共主干要谨慎。

## 用 reset 和 restore 分清两类后悔

有时候你只是想取消暂存，有时候你是真的想丢掉改动。这两个动作最好分清。

取消暂存但保留文件改动：

```bash
git restore --staged src/pages/search.astro
```

丢掉某个文件的本地改动：

```bash
git restore src/pages/search.astro
```

回到上一个提交，但保留所有文件改动：

```bash
git reset --soft HEAD~1
```

这些命令都很有用，但危险程度不同。尤其是会丢掉工作区内容的操作，执行前最好先看一眼：

```bash
git status
git diff
```

Git 很强大，但它不会替你判断哪些改动还重要。

## 合并前做一次最终检查

合并前我会习惯性跑三件事：

```bash
git status
git diff --check
npm test
```

`git status` 确认有没有误带文件；`git diff --check` 检查空白字符问题；测试则确认行为没有被改坏。对于前端或内容站点，还可以加上构建：

```bash
npm run build
```

这一步看起来朴素，但很能减少 PR 里的低级噪音。协作时，最好的礼貌之一就是让别人把注意力放在真正需要判断的地方。

## 最后

Git 历史不是为了展示自己有多严谨，而是为了降低后来理解代码的成本。

当分支名、提交拆分、提交信息和合并前检查都足够清楚时，一个改动就不再只是“代码变了”，而是一段可以被追踪、讨论和回滚的工程记录。这也是 Git 真正有价值的地方：它不只是保存版本，更是在保存判断。
