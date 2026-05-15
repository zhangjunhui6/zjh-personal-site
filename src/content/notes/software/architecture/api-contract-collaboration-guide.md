---
title: 把接口变成契约：前后端 API 协作指南
description: 从 REST、OpenAPI、错误格式、分页、鉴权、版本兼容到联调流程，整理一套真实项目里前后端协作可复用的 API 契约方法。
date: 2026-05-15
tags: [架构, API, 前端, 后端]
lang: zh
translationKey: software/architecture/api-contract-collaboration-guide
draft: false
---

前后端协作里，最容易出问题的不是“会不会调接口”，而是接口到底有没有成为契约。

没有契约时，接口会变成聊天记录：

- 这个字段可能为空吗？
- 失败时返回什么？
- 分页从 0 还是 1 开始？
- 删除后返回 200、204 还是 404？
- 权限不够是 401 还是 403？
- 后端改了字段，前端什么时候知道？

这些问题如果靠临时沟通解决，项目越大，摩擦越多。

API 契约的目标，是让前端、后端、测试、文档和监控围绕同一份事实工作。

## API 契约包含什么

一份可用的 API 契约至少包含：

- URL 和 HTTP method。
- 请求参数、query、body。
- 响应 body。
- 错误结构。
- 状态码语义。
- 鉴权要求。
- 分页、排序、筛选规则。
- 字段空值规则。
- 版本兼容策略。
- 示例请求和响应。

OpenAPI 的价值就在这里：它用机器可读的方式描述 API，让文档、代码生成、mock、测试和 review 都能围绕同一份描述展开。

## 先分清资源和动作

REST API 最常见的问题，是 URL 跟着页面或按钮长，而不是跟着资源和业务动作长。

更稳的设计是先找资源：

```text
projects
users
orders
invoices
articles
```

再设计基本操作：

```text
GET /projects
GET /projects/:id
POST /projects
PATCH /projects/:id
DELETE /projects/:id
```

然后补业务动作：

```text
POST /projects/:id/archive
POST /orders/:id/cancel
POST /articles/:id/publish
```

不要为了“纯 REST”把所有业务动作硬塞进 CRUD。`publish`、`archive`、`cancel` 这种状态流转，写成动作接口更清楚。

## HTTP 方法怎么用

常见约定：

```text
GET
  -> 获取资源，不改变状态

POST
  -> 创建资源，或执行一个非幂等业务动作

PATCH
  -> 局部更新资源

PUT
  -> 整体替换资源

DELETE
  -> 删除资源
```

前端关心的不只是名字，而是行为：

- `GET` 是否可以缓存。
- `POST` 重复提交会不会创建两次。
- `PATCH` 只传变化字段还是完整对象。
- `DELETE` 成功后前端应该移除本地项还是重新拉列表。

这些都要写进契约。

## 状态码要有语义

状态码不是装饰。它应该帮助客户端判断下一步。

常用判断：

```text
200 OK
  -> 成功，并返回响应 body

201 Created
  -> 创建成功

204 No Content
  -> 成功，但没有 body

400 Bad Request
  -> 请求格式或参数不合法

401 Unauthorized
  -> 没有登录或凭证无效

403 Forbidden
  -> 已登录，但没有权限

404 Not Found
  -> 资源不存在，或对当前用户不可见

409 Conflict
  -> 状态冲突，比如重复名称、版本冲突

422 Unprocessable Content
  -> 语义校验失败，常用于字段校验

429 Too Many Requests
  -> 限流

500 Internal Server Error
  -> 服务端未知错误
```

不要所有错误都返回 200，然后在 body 里塞 `success: false`。这会让缓存、监控、网关、SDK 和浏览器工具都失去 HTTP 语义。

## 错误格式要稳定

前端最怕后端错误格式不稳定。

推荐一个基础结构：

```json
{
  "code": "PROJECT_NAME_TAKEN",
  "message": "项目名称已存在。",
  "fields": {
    "name": "这个名称已经被使用。"
  },
  "requestId": "req_01HY..."
}
```

字段含义：

- `code`：给前端做分支和国际化。
- `message`：给用户或默认提示使用。
- `fields`：表单字段错误。
- `requestId`：排查日志和链路追踪。

如果业务复杂，可以再加：

```json
{
  "code": "PAYMENT_PROVIDER_TIMEOUT",
  "message": "支付服务暂时不可用，请稍后重试。",
  "retryable": true,
  "requestId": "req_01HY..."
}
```

关键是稳定。前端不应该为了每个接口写不同的错误解析逻辑。

## 分页、排序和筛选

分页最好一开始就定清楚，否则后面很难改。

### Offset pagination

```text
GET /projects?page=1&pageSize=20
```

适合后台列表、小数据量、跳页场景。

响应可以是：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 238
}
```

### Cursor pagination

```text
GET /events?cursor=eyJpZCI6...&limit=20
```

适合时间线、无限滚动、大数据量、实时追加。

响应可以是：

```json
{
  "items": [],
  "nextCursor": "eyJpZCI6...",
  "hasMore": true
}
```

排序和筛选也要统一：

```text
GET /projects?status=active&sort=-createdAt
```

前端需要知道：

- 支持哪些筛选字段。
- 支持哪些排序字段。
- 默认排序是什么。
- 不支持的参数如何报错。

## 字段命名和空值

字段命名要统一。

常见选择：

```json
{
  "createdAt": "2026-05-15T10:00:00.000Z",
  "ownerId": "user_123"
}
```

或者：

```json
{
  "created_at": "2026-05-15T10:00:00.000Z",
  "owner_id": "user_123"
}
```

两种都可以，混用最糟。

空值也要明确：

- 字段不存在代表什么。
- `null` 代表什么。
- 空数组和 `null` 是否有区别。
- 时间用 ISO 字符串还是时间戳。
- 金额用分为单位还是小数。

这些细节会直接影响前端类型、表单默认值和展示逻辑。

## 鉴权和权限

鉴权回答“你是谁”，权限回答“你能做什么”。

契约里要写：

- 哪些接口需要登录。
- 使用 cookie session 还是 bearer token。
- token 过期如何表现。
- 权限不足返回什么。
- 资源不可见时返回 403 还是 404。

常见约定：

```text
401
  -> 未登录、token 过期、凭证无效

403
  -> 已登录，但没有权限

404
  -> 资源不存在，或出于安全原因不暴露存在性
```

前端据此决定跳登录页、显示无权限页，还是显示不存在。

## 版本兼容

接口不是写完就不变。真正的契约要允许演进。

相对安全的变化：

- 响应新增字段。
- 新增可选请求字段。
- 新增 endpoint。
- 新增错误 code，但保留通用处理。

危险变化：

- 删除字段。
- 字段类型变化。
- 字段语义变化。
- 必填字段新增。
- 错误结构变化。

如果要做破坏性变化，有几种方式：

```text
/v2/projects
Accept: application/vnd.example.v2+json
新 endpoint 并行一段时间
feature flag 控制客户端迁移
```

小团队不一定需要复杂版本系统，但一定要有“怎么改接口不炸前端”的约定。

## OpenAPI 怎么落地

OpenAPI 不应该只是生成漂亮文档。

我会这样用：

1. 先写核心 endpoint 的 OpenAPI 描述。
2. 在 PR 里 review API 变更。
3. 用它生成文档或 mock server。
4. 生成前端类型或 SDK。
5. 用 contract test 保证实现和文档一致。

一个最小 OpenAPI 片段可能长这样：

```yaml
paths:
  /projects:
    get:
      summary: List projects
      parameters:
        - name: status
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Project list
```

重点不是一开始写完所有细节，而是让接口变化进入可 review、可自动化的流程。

## REST、GraphQL、RPC 怎么选

### REST

适合大多数业务系统。资源边界清楚，HTTP 生态成熟，调试方便。

### GraphQL

适合多端、多视图、前端需要灵活选择字段的场景。代价是 schema 设计、权限、缓存、N+1 查询和复杂度治理。

### RPC / tRPC

适合前后端同语言或强类型协作的小团队，开发体验好。代价是跨语言、跨团队、公共 API 场景可能受限。

不要为了趋势换协议。先看团队、客户端数量、类型约束、调试成本和长期维护。

## 联调流程

一个健康的前后端联调流程应该这样：

```text
需求确认
  -> API 草案
  -> 前后端 review
  -> mock / contract
  -> 前端并行开发
  -> 后端实现
  -> contract test
  -> staging 联调
  -> 发布
```

不要等后端写完才让前端开始。也不要让前端凭猜测写字段。

更好的协作方式是：接口草案先行，mock 先行，真实实现随后替换。

## 发布前检查清单

一个 API 上线前，我会检查：

- URL 和 method 是否稳定。
- 请求字段是否有校验。
- 响应字段是否有示例。
- 错误 code 是否明确。
- 分页、排序、筛选是否一致。
- 权限和鉴权是否覆盖。
- 是否有 request id。
- 是否有日志和监控。
- 是否考虑幂等和重复提交。
- 是否有兼容性说明。
- 是否更新文档或 OpenAPI。

这份清单不复杂，但能减少大部分联调返工。

## 总结

API 契约的意义，是把“我以为你会这样返回”变成“我们共同确认过系统会这样返回”。

前端需要稳定字段、错误格式和状态语义。后端需要清楚的业务边界、权限模型和演进策略。测试和运维需要 request id、日志和可观测性。

当 API 从临时沟通变成契约，前后端协作会从互相等待变成并行推进。

## 延伸阅读

- [OpenAPI Specification explained](https://learn.openapis.org/specification/)
- [OpenAPI Specification v3.0.0](https://spec.openapis.org/oas/v3.0.0.html)
- [MDN HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [JSON:API specification](https://jsonapi.org/format/)
- [GraphQL schema documentation](https://graphql.org/learn/schema/)
