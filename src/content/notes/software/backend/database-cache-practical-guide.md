---
title: 让系统有记忆，也有速度：数据库与缓存实践指南
description: 从数据库选型、表设计、约束、索引、事务、迁移到 Redis 缓存和一致性策略，整理真实项目里数据层如何设计、开发、部署和上线。
date: 2026-05-15
tags: [后端, 数据库, 缓存, 架构]
lang: zh
translationKey: software/backend/database-cache-practical-guide
draft: false
---

业务系统有两个很朴素的要求：

- 事情发生过，就不能随便丢。
- 页面打开时，不能慢到让人怀疑人生。

数据库解决第一件事，缓存解决第二件事。但真实项目里最容易出问题的地方，恰好是把这两者混在一起：把缓存当数据库，把数据库当日志仓库，把索引当魔法，把迁移当上线前的一条命令。

这篇文章不追求覆盖所有数据库理论，而是整理一套日常项目真正用得上的数据层方法。

## 先定一个默认架构

大多数 Web 项目可以从这个默认架构开始：

```text
Application
  -> PostgreSQL / MySQL
  -> Redis
  -> object storage
  -> search / analytics, when needed
```

职责先分清：

- 关系型数据库是系统事实来源。
- Redis 是加速层、协调层或短期状态层。
- 对象存储放图片、附件、大文件。
- 搜索引擎和分析系统是派生读模型，不是主事实。

如果你不知道该选什么，先选 PostgreSQL 或 MySQL，通常比一上来选一组专用存储更稳。专用存储不是不能用，而是要等问题真的出现：全文检索、时序数据、图关系、向量召回、高吞吐日志、低延迟队列，每一种都有自己的代价。

## 数据库是事实来源

数据库不是“后端旁边那个存数据的地方”，它是系统的记忆。

比如一个项目协作系统里，这些事实应该由数据库守住：

- 一个用户是否存在。
- 一个项目是否归属于某个组织。
- 一个成员在项目里的角色是什么。
- 一个任务是否已经关闭。
- 一次付款是否已经入账。
- 一条审计日志是否已经写入。

这些事实不能只靠应用代码里的 `if` 来维持。应用代码负责表达业务意图，数据库约束负责做最后防线。

## 建模从业务不变量开始

设计表结构时，不要从页面开始，而要从业务不变量开始。

以项目协作为例：

```sql
create table organizations (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  slug text not null,
  name text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table project_members (
  project_id uuid not null references projects(id),
  user_id uuid not null,
  role text not null check (role in ('owner', 'maintainer', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
```

这里的重点不是 SQL 语法，而是约束：

- `not null` 表示业务上必须有。
- `references` 表示关系真实存在。
- `unique (organization_id, slug)` 表示同一个组织下项目路径不能重复。
- `check` 表示角色只能在有限集合里。
- 复合主键表示同一个人不能重复加入同一个项目。

这些约束会让系统更烦一点，也更可靠一点。它们会在错误数据进入系统时直接拦住，而不是等问题进入报表、缓存、搜索索引和用户页面以后再追。

## 字段设计要留出演进空间

几个常见经验：

- 用稳定 ID，不要把业务可变字段当主键。
- 金额用整数最小货币单位，或数据库的精确数值类型，不要用浮点数。
- 时间统一存 UTC，展示时再按用户时区转换。
- 状态字段要写清状态机，不要让任意字符串在数据库里漂。
- 软删除要想清楚唯一约束、列表过滤和恢复规则。
- JSON 字段适合存扩展信息，不适合替代核心关系模型。

JSON 很方便，但它也容易让结构约束消失。用户偏好、第三方原始回调、实验配置可以放 JSON；订单、成员、权限、支付记录这类核心事实，最好有明确表结构。

## 索引不是越多越好

索引的目标不是“让表看起来专业”，而是让真实查询少走冤枉路。

索引设计从查询开始：

```sql
select *
from projects
where organization_id = $1
  and archived_at is null
order by created_at desc
limit 20;
```

这个查询可能需要：

```sql
create index projects_org_active_created_idx
on projects (organization_id, created_at desc)
where archived_at is null;
```

为什么不是给每个字段都建索引？

- 索引会占磁盘。
- 写入、更新、删除都要维护索引。
- 低选择性的索引未必有用。
- 多个单列索引不一定等于一个合适的复合索引。

PostgreSQL 文档里专门把索引用途、复合索引、部分索引、表达式索引、覆盖索引拆开讲。真正上线前，应该用 `EXPLAIN` 或 `EXPLAIN (ANALYZE, BUFFERS)` 看执行计划，而不是凭感觉猜。

一个实用流程：

```text
1. 写出高频查询。
2. 写出排序、分页、筛选条件。
3. 准备接近真实量级的数据。
4. 用 EXPLAIN ANALYZE 看是否扫表、是否使用索引、是否排序过重。
5. 增加或调整索引。
6. 再测一次写入成本和查询收益。
```

索引不是一次性设计完的东西。它应该随着真实查询和慢查询日志持续调整。

## 事务负责包住一次业务动作

事务不是“多条 SQL 一起执行”的语法糖。它的真正作用，是把一次业务动作变成一个可靠边界。

比如创建订单：

```text
begin
  create order
  reserve inventory
  create payment intent
  write audit event
commit
```

如果中间失败，要么全部不发生，要么进入明确的补偿流程。

几个原则：

- 事务要短，不要在事务里等慢外部 API。
- 事务里读到的数据如果马上要改，要考虑并发更新。
- 唯一约束和幂等键比“先查再插”更可靠。
- 高并发扣库存、抢名额、发券，要用行锁、乐观锁或原子更新。
- `Serializable` 不是万能保险；使用更强隔离级别时，要准备重试。

PostgreSQL 默认的 `Read Committed` 对很多普通业务足够，但复杂读写可能需要更严格的视图、显式锁或重新设计写入模型。关键是你要知道这段业务到底怕什么：脏读、重复写、超卖、状态覆盖，还是读到了不一致的聚合结果。

## 幂等比重试更重要

真实系统一定会重试：

- 用户重复点击。
- 网关超时重放。
- 支付回调重复发送。
- 消息队列至少一次投递。
- CI/CD 或运维脚本重复执行。

所以后端要给关键动作设计幂等键。

```sql
create table payment_callbacks (
  provider text not null,
  provider_event_id text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (provider, provider_event_id)
);
```

处理回调时先插入事件。如果主键冲突，说明已经处理过，直接返回成功或走重复事件逻辑。这样比“内存里记一下刚处理过”可靠得多。

## 迁移是上线流程的一部分

数据库迁移不是开发机上的小动作。它会直接影响生产系统能不能启动、旧版本应用能不能继续跑、新版本应用能不能读旧数据。

一个稳妥原则是 expand and contract：

```text
1. Expand
   先新增兼容字段、表、索引。

2. Deploy
   应用开始双写或读取新字段，同时兼容旧字段。

3. Backfill
   后台补历史数据，控制批量和锁影响。

4. Switch
   切换读取路径，观察指标。

5. Contract
   确认稳定后，再删除旧字段或旧逻辑。
```

几个上线规则：

- 迁移文件进入版本控制。
- 不手改已经合并并执行过的迁移。
- 开发环境命令和生产环境命令分开。
- 大表加字段、建索引、回填数据要评估锁和耗时。
- 迁移失败要知道如何停止、回滚或补偿。
- 应用发布和数据库迁移要有顺序。

如果使用 Prisma，开发环境常用 `migrate dev` 生成和应用迁移；生产和测试环境应该使用 `migrate deploy` 应用已经生成的迁移。不要把开发命令拿去生产上碰运气。

## 缓存不是第二个数据库

缓存最危险的误区，是把它当成另一个事实来源。

更稳的心智模型：

```text
Database = source of truth
Cache = derived copy
```

缓存可以丢，可以过期，可以重建。如果一个数据丢了以后系统就不可恢复，那它就不应该只放在缓存里。

Redis 很适合做：

- 高频读缓存。
- 会话或短期状态。
- 限流计数。
- 幂等短期标记。
- 简单分布式协调。
- 队列或 stream 的轻量场景。

但它不应该默认承担核心交易事实，除非你非常明确持久化、复制、故障恢复和数据丢失窗口。

## Cache-aside 是最常用的起点

真实业务最常见的是 cache-aside：

```text
read:
  key = buildCacheKey(query)
  value = redis.get(key)
  if value exists:
    return value

  value = database.query(query)
  redis.set(key, value, ttl)
  return value

write:
  database.transaction(...)
  redis.del(affectedKeys)
```

它的好处是简单：应用负责读缓存、查数据库、写缓存和失效缓存。

但它也有代价：

- 第一次读取会 miss。
- 写入后如果没有正确失效，会读到旧数据。
- 热点 key 过期时可能打爆数据库。
- 复杂列表缓存很难精准删除。

所以缓存设计不能只问“要不要加 Redis”，而要问：

- 缓存什么。
- 缓存多久。
- 谁负责失效。
- 允许多旧的数据。
- miss 时数据库能不能扛住。
- key 爆炸时怎么办。

## 缓存要先定义一致性

不同数据对一致性的要求完全不同。

适合缓存：

- 首页推荐。
- 热门文章列表。
- 商品详情里的非库存信息。
- 用户权限快照。
- 字典配置。
- 计算成本高但允许短暂过期的统计。

不适合随便缓存：

- 账户余额。
- 库存扣减结果。
- 支付状态最终事实。
- 权限变更后的强一致判断。

缓存不是不能用于这些场景，而是不能用“过期了就算了”的方式处理。你需要事件驱动失效、短 TTL、版本号、读写穿透策略，甚至完全不缓存关键路径。

## Key 设计要可管理

缓存 key 要可读、可版本化、可失效。

```text
project:v1:detail:{projectId}
project:v1:list:{organizationId}:{status}:{page}
user:v2:permissions:{userId}
rate-limit:v1:login:{ip}
```

几个约定：

- 加业务前缀，避免不同模块互相踩。
- 加版本号，方便结构变化时整体切换。
- 参数顺序固定，避免同一个查询生成多个 key。
- 列表缓存和详情缓存分开设计。
- key 数量要可估算，避免高基数字段造成爆炸。

如果列表缓存很复杂，优先考虑缓存详情，列表只缓存 ID 列表；或者干脆先优化数据库查询和分页。

## TTL 和 eviction 不是同一件事

TTL 是业务上允许数据多长时间后自然过期。Eviction 是 Redis 内存到达上限以后，按策略淘汰 key。

它们解决的问题不同：

- TTL 是一致性和生命周期策略。
- Eviction 是容量保护策略。

如果一个缓存 key 必须在 5 分钟后失效，那就设置 TTL。如果 Redis 内存满了才开始淘汰，那只是最后的保护，不应该成为业务正确性的依赖。

Redis 的 `INFO stats` 里有 `keyspace_hits`、`keyspace_misses`、`evicted_keys` 等指标。缓存上线后要看命中率、miss 峰值、驱逐数量和数据库压力，而不是只看 Redis 有没有运行。

## 常见踩坑

### 先缓存，后建模

如果数据库模型不稳，缓存只会把问题放大。先让查询正确，再让查询变快。

### 写入成功但缓存没删

这是最常见的脏数据来源。写路径要明确删除哪些 key；如果 key 无法精准定位，就要降低 TTL、引入事件失效，或者重构缓存粒度。

### 把锁放进缓存就以为安全

Redis 可以做一些分布式协调，但分布式锁不是万能解。很多业务其实更适合数据库唯一约束、行锁、乐观锁或幂等键。

### 缓存穿透和击穿没有保护

不存在的数据也可能被反复请求。热点 key 过期也可能让大量请求同时打到数据库。

常见处理：

- 对空结果设置短 TTL。
- 对热点 key 设置更长 TTL 或主动刷新。
- 用请求合并避免同一时刻重复回源。
- 对异常流量做限流。

### 迁移和缓存版本没同步

字段结构变了，旧缓存还在。解决方法通常是 key 版本号、部署时清理关键前缀，或让读取逻辑兼容新旧格式。

## 真实项目怎么选型

一个务实选择表：

```text
普通业务系统
  -> PostgreSQL / MySQL

需要事务、复杂查询、后台管理
  -> PostgreSQL / MySQL

高频读、允许短暂过期
  -> Redis cache-aside

全文搜索、复杂筛选、相关性排序
  -> Elasticsearch / OpenSearch / Meilisearch

事件日志、审计、异步处理
  -> 数据库 outbox + queue / stream

大文件、图片、附件
  -> object storage

指标、埋点、分析
  -> analytics database or warehouse
```

越早期，越应该少选一点。一个可靠的关系型数据库，加少量 Redis，往往能支撑相当长时间。架构不是技术清单，架构是把复杂度放在它值得出现的位置。

## 开发到上线检查表

设计阶段：

- 表是否表达了业务事实。
- 关键不变量是否有数据库约束。
- 是否有唯一键、外键、检查约束。
- 状态机是否清楚。
- 是否需要审计日志。

开发阶段：

- 高频查询是否有明确索引。
- 分页和排序是否稳定。
- 事务边界是否短而清楚。
- 关键写入是否幂等。
- 缓存 key 和 TTL 是否可解释。
- 写入后缓存如何失效。

上线阶段：

- 迁移是否可重复执行。
- 大表变更是否评估锁和耗时。
- 应用版本是否兼容迁移前后的 schema。
- 回填任务是否可暂停、可重试。
- 慢查询、缓存命中率、数据库连接数是否有监控。
- 失败时是否有回滚或补偿方案。

## 最后的判断

数据库和缓存的关系，可以用一句话记住：

数据库负责正确，缓存负责更快。

当系统还小的时候，不要急着把数据层拆得很花。先把表结构、约束、索引、事务、迁移和监控做扎实。等瓶颈真的出现，再把缓存、搜索、队列、读模型和分析系统一层一层加上去。

好的数据层不是看起来复杂，而是出问题时知道事实在哪里，慢的时候知道瓶颈在哪里，演进时知道哪一步可以安全落地。

## 参考资料

- [PostgreSQL Documentation: Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [PostgreSQL Documentation: Examining Index Usage](https://www.postgresql.org/docs/current/indexes-examine.html)
- [PostgreSQL Documentation: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL Documentation: Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Redis: Cache-aside pattern with Redis](https://redis.io/tutorials/howtos/solutions/microservices/caching/)
- [Redis Documentation: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/)
- [Prisma Documentation: Development and production migrations](https://docs.prisma.io/docs/v6/orm/prisma-migrate/workflows/development-and-production)
