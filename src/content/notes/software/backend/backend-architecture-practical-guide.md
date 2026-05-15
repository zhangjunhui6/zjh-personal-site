---
title: 把业务写成可运转的系统：后端架构实践指南
description: 从 API、服务分层、数据库、缓存、异步任务到可观测性，整理真实项目里后端架构如何选型、开发、部署和长期维护。
date: 2026-05-15
tags: [后端, 架构, API, 数据库]
lang: zh
translationKey: software/backend/backend-architecture-practical-guide
draft: false
---

后端不是“写接口查数据库”。真正的后端架构，是把业务规则变成一个能长期运行、能被验证、能被排查、能被演进的系统。

前端关心用户体验闭环，后端关心业务行为闭环：

- 请求是否合法。
- 用户有没有权限。
- 业务规则是否一致。
- 数据是否正确落库。
- 外部系统失败时如何处理。
- 重复请求是否安全。
- 线上出问题能不能定位。

这篇文章从真实项目的角度，整理后端架构的核心模块和选型方法。

## 后端架构解决什么问题

后端的核心价值不是把数据返回给前端，而是维护系统事实。

比如一个订单系统里，“支付成功”不是页面上的一个状态，而是一组需要被保证的事实：

- 订单状态变更。
- 支付记录保存。
- 库存扣减。
- 优惠券核销。
- 通知发送。
- 审计日志记录。
- 重复回调不能重复扣款。

这些都不是前端应该承担的责任。后端要负责把这些动作放进可靠边界里。

## 后端演进路线

### 简单 MVC

很多项目从 MVC 开始：

```text
Controller -> Model -> Database
View / API response
```

它适合小项目，路径短，学习成本低。但业务一复杂，Controller 很容易变胖：校验、权限、事务、外部调用和返回格式都挤在一起。

### Service 层

下一步通常是把业务逻辑放到 service：

```text
Controller
  -> request validation
  -> auth context
  -> Service
      -> business rules
      -> transaction
      -> repository / external client
  -> response
```

Controller 负责 HTTP 边界，Service 负责业务动作，Repository 或数据访问层负责持久化。这个结构不新，但非常耐用。

### 模块化单体

当业务变多时，不一定马上拆微服务。更好的中间形态是模块化单体。

```text
modules/
  users/
  projects/
  billing/
  notifications/
```

每个模块有自己的 service、数据访问、接口和测试。部署仍然是一个应用，但代码边界开始清楚。

对于很多团队，模块化单体比过早微服务更稳。

### 分布式系统

当团队、流量、部署节奏或故障边界真的需要拆分时，再考虑微服务或分布式架构。

但要知道，拆服务会引入：

- 网络调用失败。
- 分布式事务问题。
- 接口版本治理。
- 链路追踪。
- 服务发现。
- 部署编排。
- 数据一致性和补偿。

如果这些能力没有准备好，微服务不是升级，而是把复杂度提前透支。

## API 设计

API 是前后端协作的契约。

一个好的 API 至少要稳定回答：

- 资源是什么。
- 动作是什么。
- 成功返回什么。
- 失败返回什么。
- 权限错误和业务错误怎么区分。
- 分页、排序、筛选怎么表达。
- 字段能否为空。

### REST 的基本思路

REST 不等于随便写 URL。一个常见资源可以这样设计：

```text
GET /projects
GET /projects/:id
POST /projects
PATCH /projects/:id
DELETE /projects/:id
POST /projects/:id/archive
```

前四个是资源 CRUD，最后一个是业务动作。不要为了纯粹而把所有动作都塞进 CRUD。`archive`、`publish`、`cancel` 这类状态流转，用动作接口反而更清楚。

### 错误结构

错误格式应该稳定。

```json
{
  "code": "PROJECT_NAME_TAKEN",
  "message": "Project name already exists.",
  "fields": {
    "name": "This name is already used."
  },
  "requestId": "req_123"
}
```

前端需要 `code` 做分支，用户需要 `message` 看懂问题，排查需要 `requestId` 串日志。

### 版本和兼容

接口变化要尽量向后兼容。

常见策略：

- 新增字段通常安全。
- 删除字段要谨慎。
- 字段语义变化比字段名变化更危险。
- 大版本变化可以放到 `/v2` 或新 endpoint。
- 对外接口最好有 contract 测试或 schema。

## 服务分层

一个实用后端可以先这样分：

```text
routes / controllers
  -> HTTP 入参、鉴权上下文、响应格式

services
  -> 业务用例、事务、规则、领域动作

repositories
  -> 数据读写、查询组合

clients
  -> 第三方 API、支付、消息、邮件

jobs
  -> 异步任务、重试、定时任务

observability
  -> 日志、指标、链路追踪
```

不要为了“分层”而制造空壳，但当逻辑开始变多时，这些边界能阻止系统变成一团。

## 数据库设计

数据库是系统事实来源。后端最重要的判断之一，就是哪些规则应该靠数据库保证，哪些规则应该靠业务层保证。

### 关系型数据库作为默认选择

大多数业务系统可以从 PostgreSQL 或 MySQL 开始。原因很简单：

- 事务可靠。
- 约束清晰。
- 查询能力强。
- 生态成熟。
- 数据模型可维护。

不确定时，先选关系型数据库通常比一上来选 NoSQL 更稳。

### 约束不要只写在代码里

能放进数据库的约束，尽量放进去：

- 主键。
- 唯一约束。
- 外键。
- 非空。
- 索引。
- 检查约束。

代码校验可以给用户更好的错误提示，数据库约束负责最后防线。

### 迁移要可回放

数据库 schema 变化应该进入版本控制。

一个团队至少要做到：

- 本地、测试、生产都用同一套 migration。
- migration 可以在 CI 或部署流程中执行。
- 生产变更前知道是否锁表、是否影响大表。
- 回滚策略提前想好。

## 缓存和队列

缓存和队列都很有用，但都不是第一反应。

### 缓存

缓存适合解决明确的读性能问题。

加缓存前先问：

- 慢的是数据库查询、网络、序列化，还是前端重复请求。
- 数据可以接受多久不一致。
- 谁负责失效。
- 缓存击穿、穿透、雪崩是否会出现。

不要把缓存当成修复模型设计的万能药。

### 队列

队列适合处理异步、耗时、可重试的任务：

- 发送邮件。
- 生成报表。
- 图片处理。
- 支付回调后续处理。
- 外部系统同步。

队列任务要有状态、重试次数、幂等键和失败记录。否则只是把错误从请求链路藏到了后台。

## 鉴权、权限和审计

鉴权回答“你是谁”，权限回答“你能做什么”，审计回答“你做过什么”。

这三件事不要混在一起。

```text
Authentication
  -> session / token / identity

Authorization
  -> role / permission / ownership / policy

Audit
  -> actor / action / target / time / request id
```

内部系统也需要权限和审计。越是后台管理功能，越不能只靠“反正只有自己人用”。

## 可靠性

后端可靠性常常藏在细节里。

### 幂等

同一个请求重复来，不应该造成重复扣款、重复发货、重复创建。

常见做法：

- 客户端传 idempotency key。
- 后端记录处理结果。
- 外部回调按唯一事件 ID 去重。
- 状态流转检查当前状态。

### 超时和重试

调用外部服务必须有超时。重试必须有上限。失败必须可观测。

没有超时的调用，会把一个慢服务变成整个系统的慢故障。

### 限流

限流不是只有大流量才需要。登录、发送验证码、导出报表、昂贵查询，都需要保护。

## 可观测性

后端上线后，最重要的问题是：出事时能不能知道发生了什么。

至少需要：

- 结构化日志。
- request id。
- 错误上报。
- 关键指标。
- 慢查询记录。
- 部署版本记录。

当系统拆成多个服务后，还需要分布式链路追踪。OpenTelemetry 的价值就在于让日志、指标和 trace 能围绕一次请求串起来。

## 部署和配置

配置不要写死在代码里。数据库地址、API key、第三方密钥、功能开关，都应该按环境注入。

常见环境：

```text
local
test
staging
production
```

每个环境应该有清楚的配置来源、数据库、日志和部署权限。

Docker 的价值是固化运行环境，CI 的价值是让测试和构建变成自动动作，部署平台的价值是让发布和回滚可重复。

## 一个推荐的后端起步方案

如果是普通业务系统，我会这样起步：

```text
Runtime
  -> Node.js / Java / Python / Go，按团队熟悉程度选

Database
  -> PostgreSQL

API
  -> REST + OpenAPI 或类型约定

Structure
  -> controller + service + repository

Async
  -> 需要时再引入 queue

Cache
  -> 先不用，慢查询或热点明确后再加

Delivery
  -> Docker + CI + staging + logs
```

这个方案不追求炫技，但能覆盖大部分真实项目的第一阶段。

## 延伸阅读

- [The Twelve-Factor App](https://12factor.net/)
- [OpenTelemetry Observability Primer](https://opentelemetry.io/docs/concepts/observability-primer/)
- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [MDN HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
