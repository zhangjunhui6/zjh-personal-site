---
title: 把发布变成可治理的流程：Harness CI/CD 实践指南
description: 从 Harness 的 Pipeline、Stage、Step、Service、Environment、Infrastructure Definition 到 Feature Flags，理解它适合解决什么交付问题，以及真实项目该怎么落地。
date: 2026-05-15
tags: [Harness, CI/CD, DevOps, 发布流程]
lang: zh
translationKey: software/devops/harness-cicd-delivery-guide
draft: false
---

很多团队第一次接触 Harness，是因为想替换 Jenkins、GitHub Actions、GitLab CI 或一堆自维护脚本。这个动机很常见，但也容易把问题看窄。

Harness 不只是“又一个跑流水线的工具”。它更像一个软件交付控制面：把构建、部署、审批、环境、权限、回滚、特性开关和可观测性放到一个统一模型里管理。

这篇文章不做销售式介绍，而是回答几个更实际的问题：

- Harness 到底在管理什么。
- 它和普通 CI 工具有何不同。
- CI、CD、Feature Flags 分别应该怎么理解。
- 真实项目里什么时候值得用它。
- 上手时怎样少踩坑。

## Harness 解决的不是“能不能跑脚本”

小项目里，一条 CI 脚本通常就够了：

```text
checkout -> install -> test -> build -> deploy
```

问题会在团队和系统变大后出现：

- 不同服务的流水线长得不一样。
- 环境配置散落在脚本、Secrets、Wiki 和人脑里。
- 谁能部署生产环境说不清。
- 回滚靠临场操作。
- 审批、变更记录、部署结果和告警分散在多个工具里。
- 发布成功了，但新功能是否真的应该对用户开放，是另一个流程。

Harness 的价值，是把“交付”从脚本集合提升成有模型、有权限、有审计、有环境边界的流程。

它不是替代 Git，也不是替代 Docker、Kubernetes 或云平台。它站在这些工具上面，负责把构建和发布编排起来。

## Harness 的核心心智模型

可以先用这张图理解：

```text
Code Repository
  |
  v
Harness Pipeline
  |
  +-- CI Stage
  |     - checkout
  |     - install
  |     - test
  |     - build image
  |     - push artifact
  |
  +-- CD Stage
        - Service: 部署什么
        - Environment: 部署到哪里
        - Infrastructure Definition: 具体集群、主机、namespace
        - Execution: 怎么部署、怎么失败处理、是否审批
```

这个模型的关键是：CI 关注产物是否可信，CD 关注产物如何安全进入环境。

普通脚本也能部署，但脚本通常缺少一层抽象。Harness 的 Service、Environment、Infrastructure Definition 这些概念，就是为了让“部署什么、部署到哪里、怎么部署”不再混成一段难读的 YAML。

## CI：让产物可信

Harness CI 的最小形态是一条 Pipeline，里面有 Stage，Stage 里有 Step。

一个 CI 流程通常会做：

- 从 Git 仓库拉代码。
- 安装依赖。
- 跑单元测试、集成测试、lint。
- 构建应用或镜像。
- 上传 artifact 到镜像仓库或制品库。
- 输出版本号、镜像 tag、测试结果。

Harness 的 CI pipeline 可以手动运行，也可以通过 Git 事件、定时任务等触发。官方文档里也提到，Pipeline 可以存在 Harness 内部，也可以远程保存在 Git 仓库里。

我更推荐关键流水线使用远程 YAML。原因很简单：

- 变更可以 code review。
- 历史可追踪。
- 可以和业务代码一起演进。
- 不会让平台 UI 成为唯一事实来源。

### Build infrastructure

CI 必须在某个地方跑。

Harness 支持 Harness Cloud 这种托管构建基础设施，也支持团队自己的构建环境。使用 Harness Cloud 时，每个 CI stage 会运行在新的临时 VM 上，stage 结束后 VM 关闭。

这件事带来两个判断：

- 如果团队不想维护构建机器，托管 VM 很省心。
- 如果构建依赖内部网络、私有资源或特殊机器，就要认真设计自有 infrastructure 和 delegate。

不要只问“哪个便宜”。还要问构建是否可重复、是否安全、是否能访问需要的依赖。

### Stage 和 Step

Stage 是一段主要流程，Step 是具体动作。

```text
Build stage
  -> Run tests
  -> Build Docker image
  -> Push image
```

当步骤变多时，不要让 pipeline 变成一长串命令。可以用 step group、template、变量和 input set 把可复用部分抽出来。

好的 CI pipeline 应该能让新人 5 分钟看懂：

- 触发条件是什么。
- 使用哪个仓库和分支。
- 跑了哪些测试。
- 产物在哪里。
- 失败时该找谁、看哪里。

## CD：让发布可治理

Harness CD 的核心不是“执行 kubectl apply”。它把部署建模成三件事：

```text
Service
  -> 部署什么

Environment
  -> 部署到哪个环境

Infrastructure Definition
  -> 这个环境里的哪个具体集群、主机、namespace 或目标
```

官方文档把这个模型说得很直接：在每个 CD Stage 里，定义 what、where、how。

### Service：部署什么

Service 代表一个可以独立部署、监控或变更的工作负载。它通常包含：

- 镜像或 artifact。
- Kubernetes manifests、Helm chart 或其他部署规格。
- 服务级变量。
- 配置文件。

一个常见错误是把多个微服务塞进一个 Harness Service。这样短期省事，长期会让权限、回滚、监控和环境覆盖都变混乱。

更稳的方式是：一个可独立发布的服务，对应一个 Harness Service。

### Environment：部署到哪里

Environment 代表环境，比如 dev、qa、staging、production。

环境不只是名字。它会承载环境级配置、变量、覆盖规则和部署目标。

真实项目里，常见环境可以这样划分：

```text
dev
  -> 开发自测，允许频繁变化

qa
  -> 测试验证，数据可重置

staging
  -> 尽量接近生产，用于发布前验证

production
  -> 真实用户和真实数据
```

环境设计的重点不是数量，而是每个环境的责任清楚。

### Infrastructure Definition：具体目标

Infrastructure Definition 是环境里的具体基础设施，比如 Kubernetes cluster、namespace、主机组。

一个环境可以有多个 Infrastructure Definition。比如同一个 QA 环境里，不同服务可能部署到不同 cluster 或 namespace。

这也是 Harness 和简单脚本的差别：脚本里你可能只看到一串 kubeconfig 和 namespace；Harness 里这些目标被建模成可选择、可审计、可复用的对象。

### Execution：怎么部署

Execution steps 决定部署策略。常见策略包括：

- Rolling。
- Blue-green。
- Canary。
- 自定义步骤。
- 审批。
- 失败策略。

对真实生产系统来说，部署策略比“能不能部署”更重要。生产环境最好不要只有一条无保护的 deploy 命令。

## Feature Flags：把 deploy 和 release 拆开

Harness Feature Flags 的价值在于把“代码部署到生产”和“功能开放给用户”分离。

这两个动作本来就不是同一件事：

- Deploy：新代码已经进入生产环境。
- Release：用户可以看到或使用新功能。

Feature Flags 允许团队：

- 先把代码部署到生产，但默认关闭。
- 只对内部用户或小比例用户开放。
- 根据用户、组织、地区等规则做定向发布。
- 发现问题后关掉功能，而不是立刻回滚整个部署。

这对现代交付很重要。因为很多问题不是部署时才会暴露，而是功能被真实用户使用后才会暴露。

但 Feature Flags 也不是免费午餐。每个 flag 都是长期复杂度。需要约定：

- flag 命名规则。
- 谁能改生产 flag。
- flag 何时清理。
- 变更是否要审批或记录。
- 监控如何关联 flag 变化。

如果不清理，Feature Flags 会变成代码里的第二套分支系统。

## 一个真实项目怎么落地 Harness

我会按这个顺序推进。

### 1. 先整理交付对象

列出所有服务：

```text
web
api
worker
admin
```

确认每个服务：

- 代码仓库在哪里。
- 如何构建。
- 产物是什么。
- 部署到哪些环境。
- 谁能审批生产发布。
- 回滚方式是什么。

如果这些问题还答不上来，先不要急着画 pipeline。

### 2. 先做 CI 最小闭环

对每个服务建立最小 CI：

```text
checkout
install
test
build
publish artifact
```

不要一开始就把所有高级策略塞进去。先让产物可信、可追踪。

### 3. 再做非生产 CD

先把 dev 或 qa 跑通：

```text
select service
select environment
select infrastructure
deploy
verify smoke test
```

非生产环境稳定后，再把 staging 和 production 接上。

### 4. 生产环境加治理

生产环境至少要考虑：

- 手动审批。
- 变更窗口。
- 权限边界。
- Canary 或 blue-green。
- 自动/手动回滚。
- 部署后验证。
- Slack、飞书、Teams 或邮件通知。

### 5. Feature Flags 单独治理

Feature Flags 不应该被当作“产品经理随手开关”。生产 flag 是生产变更。

至少要规定：

- 谁能创建。
- 谁能打开生产。
- 是否需要关联 issue。
- 是否需要监控观察期。
- 多久必须清理。

## 什么时候适合用 Harness

适合：

- 多服务、多环境、多团队。
- Kubernetes 或云原生部署较多。
- 需要审批、权限、审计和环境治理。
- 希望统一 CI、CD、Feature Flags、验证和通知。
- 交付过程已经靠脚本和人工约定支撑不住。

不一定适合：

- 单人小项目。
- 只有一个静态站点。
- 发布频率很低，流程极简单。
- 团队还没有基本测试、构建和环境约定。

如果连 `npm test`、Docker 镜像、staging 环境都还没整理好，先把这些基础打好，比直接上 Harness 更有效。

## 常见坑

### 把 Harness 当 Jenkins UI

如果只是把原来的脚本复制进 Run step，Harness 的价值会被浪费。更好的方式是使用它的 Service、Environment、Infrastructure、Approval、Template 等模型，把交付对象建模清楚。

### 过度动态化

表达式、runtime input、变量很强大，但过度动态会让 pipeline 难以理解。生产 pipeline 应该尽量明确。

### 环境覆盖混乱

Service 里有配置，Environment 里有配置，Service Override 里也有配置。覆盖规则必须写清楚，否则一次部署到底用了哪个值会很难查。

### 没有清理 Feature Flags

过期 flag 会让代码路径翻倍。每个 flag 都应该有 owner、用途和清理计划。

### 没有把 pipeline 当代码管理

关键 pipeline 最好进 Git。否则变更历史、review 和回滚都会变弱。

## 一个推荐的 Harness 起步模板

```text
Project
  -> 按业务系统或团队划分

Service
  -> 一个可独立发布的应用一个 service

Environment
  -> dev / qa / staging / production

Infrastructure Definition
  -> 每个环境里的具体 cluster / namespace / host

CI Pipeline
  -> test + build + publish artifact

CD Pipeline
  -> deploy to environment + approval + verification

Templates
  -> 复用测试、构建、部署、通知步骤

Feature Flags
  -> 只管理需要渐进发布或快速关闭的功能
```

这个模板的原则是：先让发布可理解，再让发布自动化。

## 总结

Harness 的核心价值不是“更漂亮的流水线”，而是把软件交付变成可治理的系统。

它适合在项目进入多服务、多环境、多团队后接管交付复杂度：CI 保证产物可信，CD 管理服务进入环境的过程，Feature Flags 管理功能暴露给用户的节奏。

真正用好 Harness，不是把所有脚本搬进去，而是重新梳理：

- 我们部署什么。
- 部署到哪里。
- 谁能批准。
- 怎么验证。
- 怎么回滚。
- 怎么观察。
- 什么时候开放给用户。

这些问题答清楚，工具才会变成能力，而不是又一层复杂度。

## 延伸阅读

- [Harness Continuous Delivery overview](https://developer.harness.io/docs/continuous-delivery/overview/)
- [Harness CI pipeline creation overview](https://developer.harness.io/docs/continuous-integration/use-ci/prep-ci-pipeline-components/)
- [Harness Continuous Integration overview](https://developer.harness.io/docs/continuous-integration/get-started/overview/)
- [Harness deployment pipeline modeling overview](https://developer.harness.io/docs/continuous-delivery/cd-onboarding/new-user/cd-pipeline-modeling-overview/)
- [Harness environments overview](https://developer.harness.io/docs/continuous-delivery/x-platform-cd-features/environments/environment-overview/)
- [Harness Feature Flags overview](https://developer.harness.io/docs/feature-flags/get-started/overview/)
