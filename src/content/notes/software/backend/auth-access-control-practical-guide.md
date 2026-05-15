---
title: 把门禁装到系统里：认证与权限实践指南
description: 从登录、会话、Cookie、JWT、OAuth、RBAC、资源级鉴权到前后端协作和上线检查，整理真实项目里认证与权限系统怎么设计。
date: 2026-05-15
tags: [后端, 安全, 权限, 架构]
lang: zh
translationKey: software/backend/auth-access-control-practical-guide
draft: false
---

认证和权限系统最容易被低估。

它看起来只是“登录一下”和“判断是不是管理员”，但真正上线以后，它会变成系统的门禁、电梯卡、房间钥匙和审计记录。

一个成熟系统至少要回答这些问题：

- 你是谁？
- 你这次请求还可信吗？
- 你能不能访问这个资源？
- 你能不能执行这个动作？
- 权限变了以后，多久生效？
- 发生越权时，怎么定位是谁、在哪、为什么？

这篇文章从日常 Web 项目的角度，整理认证与权限系统的设计方法。

## 先分清三个概念

认证、会话、授权经常被混在一起，但它们不是一件事。

```text
Authentication
  -> 证明你是谁

Session management
  -> 让系统在多次 HTTP 请求之间记住你

Authorization
  -> 判断你能做什么
```

举个例子：

```text
用户输入账号密码登录
  -> authentication

服务端发出 session cookie
  -> session management

用户打开 /projects/123/settings
  -> authorization
```

登录成功不代表什么都能做。一个已经登录的普通成员，仍然不应该能删除组织、查看别人的账单、修改管理员角色。

## 一个稳妥的默认方案

大多数常规 Web 应用可以从这个方案开始：

```text
Browser
  -> HttpOnly + Secure + SameSite cookie
  -> Backend session store
  -> User / Role / Permission tables
```

也就是：

- 用服务端 session 保存登录状态。
- 浏览器只拿到不可被 JavaScript 读取的 session cookie。
- 后端每次请求都从 session 解析用户身份。
- 权限判断在后端执行。
- 前端只做体验层的展示和跳转，不做最终安全边界。

这不是唯一方案，但它是很多业务系统的好起点。它简单、可撤销、好排查，也更容易处理“用户退出登录”“管理员踢人”“权限刚刚变更”这些现实问题。

什么时候考虑 JWT？

- 移动端或第三方 API 需要 bearer token。
- 多服务之间需要传递短期访问令牌。
- 系统确实需要无状态验证。
- 认证服务和资源服务分离。

什么时候考虑 OAuth / OpenID Connect？

- 要接入 Google、GitHub、企业 SSO。
- 自己不想保存用户密码。
- 要让第三方应用代表用户访问资源。
- 要把登录交给身份提供商。

不要为了“看起来现代”强行 JWT。OWASP 的 JWT 指南也提醒：如果应用不需要完全无状态，传统 session 往往是可考虑的选择。

## 登录流程怎么设计

一个基础登录流程：

```text
POST /auth/login
  -> 校验账号密码
  -> 检查账号状态
  -> 可选 MFA / 风险验证
  -> 创建 session
  -> 设置 session cookie
  -> 返回当前用户摘要
```

响应可以是：

```json
{
  "user": {
    "id": "user_123",
    "name": "Jun",
    "roles": ["member"]
  }
}
```

几个关键点：

- 登录失败提示不要暴露“邮箱存在但密码错”这类信息。
- 密码必须用适合密码存储的算法哈希，不要明文或普通 hash。
- 登录成功后应该轮换 session，防止 session fixation。
- 高风险操作可以要求重新认证或 MFA。
- 登录、退出、密码修改、MFA 变更都应该写审计日志。

认证不是只发生在登录页。修改密码、导出数据、删除组织、修改支付方式，都可能需要重新确认身份。

## Cookie 应该怎么放

浏览器应用里，session cookie 应该尽量这样设置：

```http
Set-Cookie: __Host-session=...; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600
```

含义：

- `Secure`：只通过 HTTPS 发送。
- `HttpOnly`：JavaScript 不能通过 `document.cookie` 读取。
- `SameSite=Lax`：降低跨站请求携带 cookie 的风险。
- `Path=/`：限定 cookie 路径。
- `__Host-`：要求没有 `Domain`，并且 `Path=/`、`Secure`，能减少作用域错误。

如果前端和后端跨站部署，Cookie、CORS、CSRF 会同时变复杂。很多项目为了省掉这层复杂度，会让前端和 API 共享同一个站点域名，例如：

```text
app.example.com
app.example.com/api
```

或者：

```text
example.com
example.com/api
```

跨站 cookie 不是不能做，但要非常清楚 `SameSite=None; Secure`、CORS credentials、CSRF 防护和本地开发 HTTPS 的影响。

## Session 要能撤销

服务端 session 的最大好处之一，是可控。

一个实用 session 表可以这样设计：

```sql
create table user_sessions (
  id uuid primary key,
  user_id uuid not null references users(id),
  session_hash text not null unique,
  user_agent text,
  ip_address inet,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
```

不要把原始 session token 明文存进数据库。更稳妥的方式是：

```text
cookie contains random session token
database stores hash(session token)
```

这样数据库泄漏时，攻击者不能直接拿 token 登录。

Session 需要支持：

- 过期。
- 续期。
- 登出后撤销。
- 密码修改后撤销旧 session。
- 管理员强制下线。
- 可疑行为触发重新认证。

OWASP Session Management 指南把 session ID 看得很重，因为它在登录后临时等价于用户身份。拿到 session，就等于拿到用户当前登录态。

## JWT 怎么安全使用

JWT 的优点是自包含、可签名、容易在服务之间传递。它的问题也来自这里：发出去以后，如果没有额外设计，撤销很难。

一个常见模式：

```text
access token
  -> 短有效期，几分钟到几十分钟
  -> 用于访问 API

refresh token
  -> 长一点，但必须可撤销、可轮换
  -> 只用于换新的 access token
```

JWT 校验不能只看“能不能解析”。至少要校验：

- 签名算法和密钥。
- `iss`，签发者。
- `aud`，目标受众。
- `exp`，过期时间。
- `nbf`，生效时间。
- `sub`，用户或主体。
- `jti`，必要时用于撤销或追踪。

不要把敏感信息放进 JWT payload。JWT 通常只是编码和签名，不等于加密。浏览器、日志、代理、调试工具都可能看到 token 内容。

对于浏览器应用，尽量避免把长期 token 放到 `localStorage` 里。XSS 一旦发生，攻击者可以读取并带走 token。HttpOnly cookie 不能解决所有问题，但至少能让 JavaScript 不能直接读出 session 值。

## CSRF 和 XSS 要一起看

使用 cookie 登录态时，要考虑 CSRF：攻击者能不能诱导用户浏览器带着 cookie 去请求你的接口。

常见防护：

- `SameSite=Lax` 或 `SameSite=Strict`。
- 对写操作使用 CSRF token。
- 检查 `Origin` / `Referer`。
- 重要操作要求重新认证。
- API 只接受明确的 JSON `Content-Type`。

使用 bearer token 时，CSRF 风险通常小一些，因为浏览器不会自动给跨站请求加上 Authorization header。但如果 token 放在可被 JavaScript 读取的地方，XSS 风险会变高。

所以认证系统不能只问“cookie 还是 token”。要同时看：

- token 能不能被脚本读到。
- 浏览器会不会自动携带。
- 跨站请求能不能发起。
- 写操作有没有二次校验。

## 授权必须在服务端执行

前端隐藏按钮，只是用户体验，不是权限控制。

真正的授权必须发生在服务端：

```text
request
  -> authenticate user
  -> load resource
  -> check permission
  -> execute action
```

不要这样写：

```text
if user.role == "admin":
  allow
```

这在早期看起来够用，但业务很快会变成：

- 组织管理员只能管理本组织。
- 项目 owner 能删项目，maintainer 只能改配置。
- 账单管理员能看发票，但不能改成员角色。
- 客服能查看用户资料，但不能导出敏感数据。
- 用户只能访问自己有成员关系的资源。

权限判断应该尽量围绕资源和动作：

```text
can(user, "project.delete", project)
can(user, "billing.invoice.read", organization)
can(user, "member.invite", project)
```

这样代码读起来像业务规则，而不是一堆散落的角色判断。

## RBAC、ABAC 和资源关系

常见权限模型有三类。

### RBAC

Role-Based Access Control，按角色授权。

```text
owner
maintainer
viewer
billing_admin
```

适合大多数后台和 SaaS 系统的起点。优点是好理解、好管理。缺点是角色一多，容易膨胀。

### ABAC

Attribute-Based Access Control，按属性授权。

```text
if user.department == resource.department
if user.region == "CN" and order.region == "CN"
if document.classification <= user.clearance
```

适合组织规则复杂、属性很多的系统。缺点是排查成本更高。

### ReBAC

Relationship-Based Access Control，按关系授权。

```text
user is member of project
project belongs to organization
organization owns invoice
```

适合协作工具、组织层级、文档权限、团队空间这类产品。

真实项目通常会混合使用：

```text
角色决定大范围能力
资源关系决定能不能碰某个对象
属性决定特殊限制
```

## 数据模型怎么落地

一个简单 RBAC + 资源关系模型：

```sql
create table organization_members (
  organization_id uuid not null references organizations(id),
  user_id uuid not null references users(id),
  role text not null check (role in ('owner', 'admin', 'member', 'billing')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table project_members (
  project_id uuid not null references projects(id),
  user_id uuid not null references users(id),
  role text not null check (role in ('owner', 'maintainer', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
```

权限函数可以集中写：

```ts
type Action = 'project.read' | 'project.update' | 'project.delete';

export function canProject(user: UserContext, action: Action, project: ProjectContext) {
  const membership = project.memberships.find((member) => member.userId === user.id);

  if (!membership) return false;
  if (membership.role === 'owner') return true;
  if (membership.role === 'maintainer') return action !== 'project.delete';
  return action === 'project.read';
}
```

这只是示意。真实系统里可能会把权限定义放到策略表、配置文件或 policy engine。但不管怎么抽象，目标都一样：让权限判断集中、可测试、可审计。

## 多租户权限要特别小心

SaaS 系统最常见的安全事故之一，是跨租户访问。

错误写法：

```sql
select * from projects where id = $1;
```

更稳的写法：

```sql
select p.*
from projects p
join organization_members m on m.organization_id = p.organization_id
where p.id = $1
  and m.user_id = $2;
```

或者在服务层保证每次查询都带上 tenant scope：

```text
getProject({ projectId, organizationId, userId })
```

不要先按 ID 查出资源，再在某个很远的地方“顺手判断一下”。资源加载和权限判断越近，越不容易漏。

## 前端应该做什么

前端不是安全边界，但它有非常重要的体验职责。

前端应该：

- 根据当前用户能力隐藏不可用入口。
- 对 401 跳登录或刷新会话。
- 对 403 显示无权限状态。
- 对权限变化后的页面做重新拉取。
- 避免把敏感 token 放到可被脚本读取的长期存储。
- 不在客户端保存“最终权限事实”。

前端不应该：

- 只靠路由守卫保护数据。
- 只靠隐藏按钮阻止危险操作。
- 把 `isAdmin=true` 当成可信判断。
- 把权限逻辑复制成和后端不一致的第二套系统。

一个比较舒服的前后端协作方式，是后端在当前用户接口里返回能力摘要：

```json
{
  "user": {
    "id": "user_123",
    "name": "Jun"
  },
  "capabilities": {
    "project.create": true,
    "billing.invoice.read": false
  }
}
```

前端用它控制体验，后端仍然在每个接口里重新鉴权。

## API 状态码要清楚

认证和授权错误要分清：

```text
401 Unauthorized
  -> 你没有登录，或登录态无效

403 Forbidden
  -> 你已登录，但没有权限

404 Not Found
  -> 资源不存在，或为了避免泄露存在性而对无权用户隐藏
```

对于多租户系统，有些资源不想暴露“是否存在”。这时无权限访问可以返回 404。但团队要统一约定，否则前端和排查都会混乱。

错误结构仍然应该稳定：

```json
{
  "code": "PROJECT_ACCESS_DENIED",
  "message": "你没有权限访问这个项目。",
  "requestId": "req_01HY..."
}
```

## 审计日志不是以后再说

权限系统没有审计日志，出了事会很难查。

至少记录：

- 登录成功和失败。
- 退出登录。
- 密码修改。
- MFA 开启、关闭、重置。
- 角色变更。
- 成员邀请和移除。
- 高风险资源读取。
- 删除、导出、支付、密钥创建。

审计日志要包含：

```text
actor
action
target
result
ip
user agent
requestId
createdAt
```

不要把密码、token、密钥明文写进日志。日志是排查工具，不应该变成另一个泄漏面。

## 上线前检查表

认证：

- 密码是否安全哈希。
- 登录失败提示是否避免枚举账号。
- 是否有速率限制和异常登录监控。
- 是否支持 MFA 或高风险操作重新认证。
- 密码修改后是否撤销旧 session。

会话：

- Cookie 是否 `Secure`、`HttpOnly`、`SameSite`。
- Session 是否可过期、可撤销、可轮换。
- 登出是否真正让服务端 session 失效。
- Session token 是否只存 hash。
- 跨站部署是否处理 CORS credentials 和 CSRF。

JWT / OAuth：

- 是否校验签名、算法、`iss`、`aud`、`exp`。
- Access token 是否足够短。
- Refresh token 是否可撤销、可轮换。
- OAuth 是否使用当前安全建议，例如 Authorization Code + PKCE。
- 回调地址是否严格匹配。

授权：

- 后端是否在每个敏感接口做权限判断。
- 是否有资源级鉴权。
- 多租户查询是否默认带 tenant scope。
- 前端隐藏入口之外，后端是否仍然拒绝越权请求。
- 权限逻辑是否有测试。

审计：

- 登录、权限变化、高风险操作是否记录。
- 日志里是否有 requestId。
- 是否避免记录 token、密码、密钥。
- 出现 401 / 403 峰值时是否有监控。

## 最后的判断

认证证明“你是谁”，会话维持“这次请求是否还可信”，授权决定“你能不能做这件事”。

前端可以让权限体验更自然，但最终门禁必须在后端。数据库要保存角色和关系，服务层要集中执行策略，日志要能还原关键动作。

好的权限系统不是把用户拦在门外，而是让每个用户只进入他应该进入的房间，并且系统知道这扇门什么时候、被谁、为什么打开过。

## 参考资料

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [MDN Secure cookie configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies)
- [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700)
