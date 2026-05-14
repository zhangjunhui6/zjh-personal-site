---
title: Git 是什么，以及日常开发怎么用好它
description: 从 Git 的基本概念、常用命令到团队协作流程和效率工具，整理一份日常开发可复用的 Git 指南。
date: 2026-05-14
tags: [Git, 开发流程, 工具]
lang: zh
draft: false
---

Git 经常被解释成“版本控制工具”，这当然没错，但还不够。真正把 Git 用顺以后，它更像一个保存判断、组织协作、降低回滚成本的工作系统。

这篇文章不追求把所有命令都列完，而是回答四个更实际的问题：

- Git 到底在管理什么。
- 日常开发里最常用的命令分别适合什么场景。
- 团队协作时怎样用 Git 少制造麻烦。
- 哪些插件和工具能明显提高效率。

## Git 是什么

Git 是一个分布式版本控制系统。版本控制系统会记录项目历史，让你知道“谁在什么时候，因为哪件事改了什么”，也让你能回到以前的版本。分布式的意思是：每个开发者本地都有一份完整仓库和历史，不是所有动作都必须依赖远端服务器。

理解 Git，先抓住几个概念就够了。

### 仓库

仓库是 Git 管理的项目。它包含当前文件，也包含这些文件的历史。平时你看到的是工作目录，真正的历史和对象数据保存在隐藏的 `.git` 目录里。

### 提交

提交是 Git 历史里最重要的单位。你可以把一次提交理解成项目在某个时间点的一张快照。Git 不是只把它当成一串零散补丁，而是围绕快照、对象和引用来组织历史。

一个好的提交最好能独立说明一次完整意图，比如：

```bash
git commit -m "feat: add search shortcut"
```

### 工作区、暂存区、本地仓库、远端仓库

日常最常见的流动路径是：

```text
工作区 -> 暂存区 -> 本地仓库 -> 远端仓库
```

对应到命令就是：

```bash
git status
git add src/pages/index.astro
git commit -m "feat: add homepage search"
git push
```

工作区是你正在编辑的文件；暂存区是下一次提交会包含的内容；本地仓库保存已经提交的历史；远端仓库通常是 GitHub、GitLab、Bitbucket 这类协作平台上的共享仓库。

暂存区很重要。它允许你从一堆本地改动里挑出“这一组先提交”，把不同目的的修改拆开。

### 分支

分支可以理解成一条独立的开发线。你可以在分支上尝试功能、修复 bug、整理文章，确认没问题后再合回主分支。

```bash
git switch main
git pull --ff-only
git switch -c feature/search-shortcut
```

分支不是为了让历史变复杂，而是为了隔离正在进行的工作。一个任务一条分支，是最容易维护的起点。

## 常用命令和场景

### 创建和获取仓库

新项目从本地开始：

```bash
git init
git add .
git commit -m "chore: initial commit"
```

已有远端项目拉到本地：

```bash
git clone git@github.com:owner/repo.git
```

进入一个陌生仓库后，先看三件事：

```bash
git status
git branch --show-current
git log --oneline --decorate -n 10
```

这能告诉你当前在哪个分支、工作区是否干净、最近发生过什么。

### 查看改动

写代码过程中，`status` 和 `diff` 是最值得高频使用的两个命令：

```bash
git status
git diff
git diff --staged
```

`git diff` 看还没暂存的改动，`git diff --staged` 看已经进入下一次提交的改动。提交前先看 diff，可以减少误提交文件、调试代码和临时内容。

### 暂存和提交

把所有改动都放进一次提交很方便，但不一定健康。更推荐按意图暂存：

```bash
git add src/components/SearchShortcut.astro
git add src/pages/index.astro
git commit -m "feat: add homepage search shortcut"
```

如果一个文件里混了两类改动，可以交互式选择：

```bash
git add -p
```

这条命令很适合把“功能实现”和“顺手格式化”拆开。提交越清楚，review 和回滚越省力。

### 分支切换和协作

创建任务分支：

```bash
git switch -c feature/git-guide
```

切回已有分支：

```bash
git switch main
```

查看本地分支：

```bash
git branch
```

删除已经合并的本地分支：

```bash
git branch -d feature/git-guide
```

分支命名建议包含类型和主题，例如：

```text
feature/search-shortcut
fix/rss-draft-filter
content/git-guide
chore/update-ci
```

### 拉取和推送

从远端更新信息：

```bash
git fetch origin
```

更新当前分支：

```bash
git pull --ff-only
```

第一次推送新分支：

```bash
git push -u origin feature/git-guide
```

`fetch` 只是把远端信息拿回来，不会直接改你的工作分支；`pull` 会在获取后尝试合并或变基。刚开始不确定时，可以先 `fetch`，再用 `git log` 或 `git diff` 看清楚差异。

### 合并、变基和整理历史

把主分支更新合进当前分支，常见有两种方式。

合并：

```bash
git merge origin/main
```

变基：

```bash
git rebase origin/main
```

`merge` 会保留分支汇合的历史形状；`rebase` 会把你的提交“搬到”新的基底之后，让历史更线性。日常建议是：自己的功能分支可以 rebase，已经多人共享或已经发布出去的公共分支不要随便改写历史。

整理本地提交时，可以用交互式 rebase：

```bash
git rebase -i origin/main
```

常见动作有：

- `reword`：修改提交信息。
- `squash`：把多个修补提交合并。
- `drop`：丢掉某个不需要的提交。

不要为了“历史漂亮”过度整理。好的历史应该帮助理解，不是把真实工作过程化妆成毫无波澜。

### 临时保存工作

正在写一半，需要临时切分支处理别的事：

```bash
git stash push -m "wip: search layout"
git switch fix/urgent-issue
```

回来以后恢复：

```bash
git stash list
git stash pop
```

如果这份改动已经比较重要，更推荐直接提交到临时分支。`stash` 适合短期收纳，不适合长期存档。

### 撤销和回滚

取消暂存但保留文件改动：

```bash
git restore --staged src/pages/search.astro
```

丢掉某个文件的本地未提交改动：

```bash
git restore src/pages/search.astro
```

撤销已经提交并公开的改动：

```bash
git revert <commit>
```

回退本地提交但保留改动：

```bash
git reset --soft HEAD~1
```

这里最需要谨慎的是 `reset`。它可以很方便地重写本地历史，但如果用在已经推送且有人基于它继续工作的分支上，就容易影响别人。公共历史优先用 `revert`。

## 工作中怎么用好 Git

### 让分支对应一个任务

一个分支最好只服务一个明确目标：一个功能、一个 bug、一次内容改动、一次维护升级。分支范围越清楚，PR 描述、代码 review 和最终回滚都越简单。

### 提交按意图拆分

提交不一定只能改一个文件，但它应该只表达一个意图。比如做搜索入口，可以拆成：

```text
feat: add reusable search shortcut
feat: show search shortcut on directory pages
test: cover search entrypoints
```

比起一个巨大的 `feat: update site`，这种历史更容易 review，也更容易在出问题时定位。

一个简单判断：如果你很难用一句话说明这个提交做了什么，它可能就太大了。

### 提交信息写结果

提交信息不是写给 Git 的，是写给未来的人看的。它应该描述代码库获得了什么变化，而不是记录你做了什么动作。

推荐：

```text
feat: add archive page
fix: exclude draft entries from RSS
docs: document content publishing workflow
```

不推荐：

```text
update files
fix stuff
change code
```

如果团队使用 Conventional Commits，可以把 `feat`、`fix`、`docs`、`test`、`chore` 这类前缀固定下来。重点不在格式本身，而在让历史可以被快速扫描。

### 提 PR 前自己先走一遍

我的习惯是至少检查四件事：

```bash
git status
git diff
git diff --check
npm test
```

如果是前端或内容站点，再补一个构建：

```bash
npm run build
```

`status` 确认没有误带文件；`diff` 让自己先 review 一遍；`diff --check` 能抓一些空白问题；测试和构建则验证行为没有被改坏。

### 冲突不要急着“选全部”

遇到冲突时，先确认三件事：

```bash
git status
git diff
git log --oneline --left-right --graph HEAD...origin/main
```

然后逐个文件理解两边改动的意图。很多冲突不是“保留我的”或“保留对方的”这么简单，而是要把两边有效变化重新组合起来。解决后再跑测试，最好也打开相关页面或功能手动看一眼。

### 保护主分支

团队协作里，`main` 或 `master` 应该是相对稳定的基线。比较稳的做法是：

- 所有改动走 PR。
- 主分支要求 CI 通过。
- 至少有一次 review 后再合并。
- 公共分支不随意 force push。
- 发布后发现问题优先用 `revert`，少在公共历史上做手术。

这样做会让流程看起来多一步，但它换来的是更少的“谁把主分支弄坏了”。

## 一套日常工作流

下面是一套足够通用的工作流，适合多数小团队和个人项目：

```bash
git switch main
git pull --ff-only

git switch -c feature/git-guide

# 写代码或内容
git status
git diff
git add -p
git commit -m "docs: rewrite git guide"

git fetch origin
git rebase origin/main

npm test
git push -u origin feature/git-guide
gh pr create --base main --draft
```

这套流程背后的原则很简单：

- 开始前先基于最新主分支。
- 每个任务有独立分支。
- 提交前看 diff。
- 合并前跑测试。
- 用 PR 把讨论、CI 和最终合并放到同一个协作入口。

## 能提高效率的工具和插件

命令行是 Git 的核心，但不代表所有动作都必须硬敲命令。好的工具能减少切换上下文，也能让历史、冲突和差异更可视化。

### VS Code 内置 Git 和 GitLens

VS Code 自带 Git 面板已经能完成暂存、提交、查看 diff、处理冲突等基础操作。GitLens 适合进一步看文件历史、行级 blame、提交图和 PR 上下文。它最大的价值不是“替你用 Git”，而是把“这行为什么变成这样”这类问题查得更快。

### GitHub CLI

如果项目在 GitHub 上，`gh` 很适合把 PR 流程放回终端：

```bash
gh pr create --base main --draft
gh pr status
gh pr checks
gh pr view --web
```

它适合已经习惯命令行的人。写完代码后不用离开终端，就能创建 PR、看检查状态、打开 review 页面。

### GUI 客户端：GitHub Desktop、Fork、Sourcetree

GUI 客户端适合三类场景：

- 你想更直观看分支图和提交历史。
- 你需要逐行暂存、丢弃、对比改动。
- 你遇到冲突，希望用可视化界面辅助判断。

GitHub Desktop 更轻，适合 GitHub 项目和基础协作；Fork 的 diff、rebase、冲突处理体验比较强；Sourcetree 功能完整，适合喜欢可视化分支图和复杂操作的人。

### 终端 UI：lazygit 和 tig

如果你喜欢终端，但又不想每次都输入长命令，可以试试 lazygit 或 tig。

`lazygit` 是一个终端里的 Git 操作界面，适合暂存、提交、分支、stash、push/pull 这些高频动作。`tig` 更偏仓库浏览器和历史查看器，也能辅助按块暂存。它们都适合“手还在终端里，但想更快看清状态”的时候。

### pre-commit

`pre-commit` 可以把格式化、lint、空白检查、提交信息检查等动作放到 Git hooks 里，在提交前自动执行。

它适合团队统一底线：不要把 trailing whitespace、格式错误、明显 lint 问题留给 code review。code review 应该尽量讨论设计和行为，而不是反复指出机械问题。

### Commitizen

如果团队希望提交信息稳定遵循 Conventional Commits，Commitizen 可以用交互式方式生成提交信息，也可以配合 hook 校验格式。它不适合替代思考，但很适合减少“这次前缀到底写什么”的小摩擦。

## 最后

把 Git 用好，不是记住最多命令，也不是把历史修饰得完美无瑕。

真正有价值的是形成一套稳定习惯：改动前知道自己在哪个分支，提交前看 diff，提交时按意图拆分，推送前跑检查，合并前让 PR 和 CI 兜住风险。这样 Git 就不只是“保存版本”的工具，而是日常开发里帮助你和团队保持清醒的协作基础设施。

## 参考资料

- [Pro Git: What is Git?](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F)
- [Git Reference](https://git-scm.com/docs)
- [GitHub Docs: About Git](https://docs.github.com/en/get-started/using-git/about-git)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [GitLens on Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)
- [lazygit](https://github.com/jesseduffield/lazygit)
- [tig](https://jonas.github.io/tig/)
- [pre-commit](https://pre-commit.com/)
- [Commitizen](https://commitizen-tools.github.io/commitizen/)
- [GitHub Desktop](https://desktop.github.com/)
- [Fork](https://git-fork.com/)
- [Sourcetree](https://www.sourcetreeapp.com/)
