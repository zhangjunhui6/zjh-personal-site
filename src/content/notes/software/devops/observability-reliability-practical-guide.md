---
title: 让系统开着灯运行：可观测性与可靠性实践指南
description: 从日志、指标、链路追踪、告警、SLO、错误预算、事故复盘到上线检查，整理真实项目如何知道系统是否健康、如何定位问题、如何长期变稳。
date: 2026-05-15
tags: [DevOps, 可观测性, 可靠性, 架构]
lang: zh
translationKey: software/devops/observability-reliability-practical-guide
draft: false
---

系统上线以后，真正的问题才开始。

本地能跑、测试能过、部署成功，只能说明代码被送到了线上。它不说明用户体验正常，也不说明支付没有失败、队列没有积压、缓存没有击穿、数据库没有慢到临界点。

可观测性和可靠性的目标，是让团队能持续回答三个问题：

- 系统现在健康吗？
- 如果不健康，哪里出了问题？
- 下次怎样让它更不容易坏？

没有可观测性，线上系统就像关灯开车。你也许还能往前开一段，但每一次转弯都在赌。

## 先分清监控和可观测性

监控更像固定仪表盘：你事先知道要看什么。

```text
CPU usage
memory usage
HTTP 500 rate
database connections
queue length
```

可观测性更像调查能力：你不一定提前知道问题是什么，但系统留下的信号足够你追过去。

```text
这次请求为什么慢？
哪个下游调用失败最多？
某个用户为什么总是 403？
刚发布后错误率是不是只影响一个 region？
支付回调重复处理了吗？
```

监控回答“已知问题有没有发生”。可观测性帮助你调查“未知问题为什么发生”。

## 三类核心信号

OpenTelemetry 把 telemetry signal 分成 traces、metrics、logs 等类别。日常工程里可以先这样理解：

```text
Metrics
  -> 系统在一段时间内的数字变化

Logs
  -> 某个时刻发生了什么事

Traces
  -> 一次请求穿过了哪些服务和步骤
```

它们不是互相替代的。

指标适合看趋势和报警，日志适合看细节，链路追踪适合看一次请求的路径。

一个健康的排障体验通常是：

```text
alert fires
  -> dashboard sees error rate rising
  -> trace shows slow dependency
  -> logs show specific error code and requestId
  -> runbook tells operator what to check next
```

## 从用户体验定义可靠性

可靠性不能只从服务器角度定义。

用户真正关心的是：

- 页面能不能打开。
- 操作能不能成功。
- 数据有没有丢。
- 响应是不是足够快。
- 支付、注册、提交、搜索这些关键路径是否可用。

所以不要一开始就盯着 CPU。CPU 很重要，但 CPU 正常不代表用户正常。

更好的起点是关键用户旅程：

```text
用户登录
创建项目
提交订单
支付成功
上传文件
搜索内容
打开仪表盘
```

然后给每条旅程定义成功率、延迟和错误类型。

## SLI、SLO 和错误预算

Google SRE 体系里，可靠性常用三个概念组织：

```text
SLI: Service Level Indicator
  -> 实际测量指标

SLO: Service Level Objective
  -> 团队承诺达到的目标

Error budget
  -> 在一个周期里允许失败的空间
```

举个例子：

```text
SLI
  -> /api/orders 的 2xx / 3xx 成功请求比例

SLO
  -> 30 天内 99.9% 的订单创建请求成功

Error budget
  -> 0.1% 的请求可以失败
```

SLO 的价值不是写一个漂亮数字，而是帮助团队做取舍。

如果错误预算还很充足，团队可以继续发布功能。如果错误预算已经快花完，就应该优先处理稳定性问题：降低发布频率、修复慢查询、补幂等、加限流、改回滚流程。

可靠性不是“永远不出错”。可靠性是清楚知道系统允许承受多少风险，并且在风险超标前停下来处理。

## 指标怎么设计

指标不要一上来就收集一切。先按层次设计。

### 用户层指标

```text
page load time
checkout success rate
login success rate
search latency
file upload success rate
```

这些指标最贴近用户体验。

### API 层指标

```text
request count
error rate
latency p50 / p95 / p99
status code distribution
rate limit count
```

HTTP 服务至少应该按 route、method、status class 维度观察。但 label 不能无限增长，不要把 userId、email、完整 URL 这种高基数字段放进指标标签。

### 依赖层指标

```text
database query latency
database connection pool usage
redis hit rate
redis evicted keys
queue depth
third-party API error rate
```

依赖层指标能帮你判断问题是应用代码、数据库、缓存、队列，还是第三方服务。

### 资源层指标

```text
CPU
memory
disk
network
container restarts
```

这些指标适合排查容量和基础设施问题，但通常不应该是唯一的业务告警来源。

## 日志要结构化

日志不是给人肉眼刷屏看的。日志应该能被查询、聚合和关联。

一个好的应用日志至少包含：

```json
{
  "level": "error",
  "message": "Project update failed",
  "requestId": "req_01HY...",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "userId": "user_123",
  "route": "PATCH /projects/:id",
  "projectId": "project_456",
  "errorCode": "PROJECT_ARCHIVED",
  "durationMs": 184,
  "time": "2026-05-15T08:00:00.000Z"
}
```

几个原则：

- 用结构化 JSON，不要只拼字符串。
- 每个请求都有 `requestId`。
- 能接入 trace 的地方带上 `traceId`。
- 错误要有稳定 `errorCode`。
- 不要记录密码、token、密钥、完整银行卡号。
- 日志级别要克制，避免把正常业务刷成 error。

日志最重要的能力不是“记录得多”，而是出事时能用一个 `requestId` 串起请求入口、服务日志、数据库操作、下游调用和前端错误。

## 链路追踪解决路径问题

当系统只有一个服务时，日志往往够用。系统一旦有前端、API、数据库、缓存、队列、第三方 API，单靠日志就很难知道一次请求到底在哪里变慢。

链路追踪关注一次请求的路径：

```text
HTTP POST /orders
  -> auth middleware
  -> order service
  -> database insert
  -> payment provider
  -> outbox event
  -> response
```

每一段叫 span，整条路径叫 trace。

trace 的价值：

- 看清请求经过哪些组件。
- 看每个组件耗时。
- 找到慢点和错误点。
- 把日志和指标关联起来。
- 在微服务或异步系统里保留上下文。

OpenTelemetry 的重要意义，是提供一套 vendor-neutral 的采集和导出标准。你可以先用 OpenTelemetry SDK 或 auto-instrumentation 采集，再通过 collector 导出到不同后端。

## 前端也要有可观测性

前端不是“如果后端没报错就没事”。

前端需要关注：

- 页面加载时间。
- Core Web Vitals。
- JavaScript 错误。
- API 请求失败。
- 用户操作失败。
- 白屏和资源加载失败。
- 关键流程转化率。

一个前端错误事件至少要包含：

```json
{
  "type": "client_error",
  "message": "Cannot read properties of undefined",
  "route": "/projects/123/settings",
  "release": "2026.05.15-1",
  "userId": "user_123",
  "requestId": "req_01HY...",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
}
```

前端错误如果能和后端 requestId 或 traceId 接上，排障速度会快很多。

## 告警要少而准

告警不是越多越安全。告警太多会让人麻木，最后真正的问题也没人信。

好的告警应该满足：

- 用户正在受影响，或很快会受影响。
- 有明确负责人。
- 有可执行动作。
- 有 runbook。
- 不因为短暂抖动反复叫醒人。

不好的告警：

```text
CPU > 80% for 1 minute
```

可能好一点的告警：

```text
checkout_success_rate < 99.5% for 10 minutes
and request_count > minimum_traffic_threshold
```

Prometheus 的 alerting rules 可以通过表达式定义条件，再把 firing alerts 交给 Alertmanager 路由、分组和通知。关键不是工具，而是告警条件要和用户影响、业务目标、处理动作绑定。

## Dashboard 应该服务场景

Dashboard 不是展示墙。

每个 dashboard 应该回答一个问题：

```text
系统整体健康吗？
订单链路有没有问题？
数据库是不是瓶颈？
刚刚发布有没有引入错误？
某个租户是不是异常？
```

一个通用服务 dashboard 可以包括：

- 请求量。
- 错误率。
- 延迟 p50 / p95 / p99。
- 饱和度：连接池、队列、CPU、内存。
- 下游依赖错误率和延迟。
- 最近发布版本标记。
- 当前触发的告警。

不要把所有图塞到一个页面里。排障时最怕的是图很多，但没有一张能回答下一步该去哪。

## Runbook 把经验写下来

告警必须配 runbook。

Runbook 不需要写成论文，但应该回答：

- 这个告警说明什么。
- 可能影响哪些用户或业务。
- 第一眼看哪些 dashboard。
- 常见原因是什么。
- 可以安全执行哪些操作。
- 什么时候升级给谁。
- 怎么确认恢复。

一个简短模板：

```text
Alert: APIHighErrorRate

Impact:
  Users may fail to create or update projects.

First checks:
  1. Open service overview dashboard.
  2. Check deploy marker in the last 30 minutes.
  3. Inspect traces for top failing route.
  4. Check database connection pool and slow queries.

Safe actions:
  - Roll back latest deploy if errors started after release.
  - Disable non-critical feature flag.
  - Increase queue workers only if queue depth is rising and database is healthy.

Escalation:
  Backend on-call, then database owner.
```

Runbook 的价值，是让凌晨三点的人不用靠记忆工作。

## 事故处理流程

线上事故不要只靠聊天群。

一个基本流程：

```text
detect
  -> declare incident
  -> assign incident lead
  -> create timeline
  -> mitigate
  -> communicate
  -> resolve
  -> review
```

几个角色：

- Incident lead：控制节奏，做决策。
- Investigator：查原因。
- Operator：执行回滚、开关、扩容等动作。
- Communicator：对内对外同步状态。

事故中最重要的不是立刻证明谁错了，而是先止血。复盘时再讨论根因、系统改进和流程修补。

## 复盘要无责，但要具体

好的复盘不是“以后大家小心一点”。

复盘应该产出具体改进：

- 哪个告警太晚。
- 哪个 dashboard 缺图。
- 哪个 runbook 不完整。
- 哪个发布流程缺回滚验证。
- 哪个数据库迁移风险没被发现。
- 哪个权限或幂等规则没有测试。

一个复盘结构：

```text
Summary
Impact
Timeline
Root causes
What went well
What went poorly
Action items
Owners and due dates
```

无责不是没有责任。无责的意思是把问题当作系统问题处理，而不是把人的失误当作终点。

## 发布也要可观测

每次发布都应该能在观测系统里留下痕迹。

至少记录：

- release version。
- commit SHA。
- deploy time。
- environment。
- feature flags 状态。
- migration 是否执行。
- 回滚记录。

发布后要看：

- 错误率是否上升。
- p95 / p99 延迟是否变差。
- 关键业务成功率是否下降。
- 前端错误是否增加。
- 特定租户、地区、浏览器是否异常。

如果使用灰度发布或 feature flags，观测维度应该能按版本、flag、region、tenant 切开。否则灰度只是“慢慢扩大影响范围”，不是可控发布。

## 真实项目怎么落地

一个务实路线：

### 第一阶段：单体或小团队

先做到：

- 结构化日志。
- 请求 ID。
- HTTP 请求量、错误率、延迟。
- 数据库连接池和慢查询。
- 基础 uptime check。
- 关键路径失败告警。

不要一开始搭一套大而全平台。先让团队能回答“谁失败了，为什么失败，最近是不是发布过”。

### 第二阶段：服务变多

补上：

- OpenTelemetry tracing。
- traceId 注入日志。
- 服务依赖图。
- 统一 dashboard。
- runbook。
- 发布标记。
- 队列、缓存、第三方依赖指标。

这时排障重点从“单个服务为什么错”变成“请求在系统里哪里断了”。

### 第三阶段：产品成熟

再做：

- SLO 和错误预算。
- 用户旅程指标。
- 事故流程。
- 值班轮换。
- 容量规划。
- 混沌演练或故障注入。
- 成本和观测数据保留策略。

成熟系统不只是工具更多，而是可靠性进入产品和工程决策。

## 上线检查表

应用：

- 每个请求是否有 requestId。
- 错误是否有稳定 errorCode。
- 日志是否结构化。
- 是否避免记录敏感信息。
- 慢接口是否能定位到 route 和依赖。

指标：

- 是否有请求量、错误率、延迟、饱和度。
- 是否有关键用户旅程成功率。
- 是否有数据库、缓存、队列、第三方依赖指标。
- 指标 label 是否避免高基数。

追踪：

- 入口请求是否创建 trace。
- 下游 HTTP、数据库、队列是否能关联 span。
- 日志是否带 traceId。
- 采样策略是否合理。

告警：

- 告警是否对应用户影响。
- 是否有 runbook。
- 是否有负责人。
- 是否避免短暂抖动。
- 是否覆盖发布后关键路径。

流程：

- 发布是否有版本标记。
- 回滚是否验证过。
- 事故是否有负责人和时间线。
- 复盘 action item 是否有 owner 和 due date。

## 最后的判断

可观测性不是为了做漂亮 dashboard。可靠性也不是为了追求一个永远不会坏的神话。

它们共同解决的是一个现实问题：系统会出错，而团队需要足够快地发现、足够稳地止血、足够清楚地复盘、足够具体地改进。

当一个系统有稳定的指标、可查的日志、能串起来的 trace、少而准的告警、能执行的 runbook 和诚实的复盘，它就不再只是“部署成功”的代码，而是一个真正能被运营、维护和信任的产品。

## 参考资料

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry Signals](https://opentelemetry.io/docs/concepts/signals/)
- [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Book: Embracing Risk](https://sre.google/sre-book/embracing-risk/)
- [Prometheus: Alerting rules](https://prometheus.io/docs/prometheus/2.53/configuration/alerting_rules/)
- [Prometheus: Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Grafana Documentation: About metrics and telemetry](https://grafana.com/docs/grafana/latest/visualizations/simplified-exploration/metrics/about-metrics/)
