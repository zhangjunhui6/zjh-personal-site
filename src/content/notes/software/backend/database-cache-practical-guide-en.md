---
title: "Memory And Speed: A Practical Guide To Databases And Cache"
description: A practical guide to database choices, schema design, constraints, indexes, transactions, migrations, Redis caching, and cache consistency in real projects.
date: 2026-05-15
tags: [Backend, Database, Cache, Architecture]
lang: en
translationKey: software/backend/database-cache-practical-guide
draft: false
---

Business systems have two plain requirements:

- When something happened, the system must not lose it.
- When a page opens, it should not feel painfully slow.

Databases solve the first problem. Cache helps with the second. Real projects usually get into trouble when these responsibilities blur: cache becomes a second database, the database becomes a dumping ground, indexes are treated as magic, and migrations become a command someone runs right before deploy.

This guide does not try to cover every database theory. It maps the data-layer decisions that matter in everyday software projects.

## Start With A Default Architecture

Most web applications can start with this shape:

```text
Application
  -> PostgreSQL / MySQL
  -> Redis
  -> object storage
  -> search / analytics, when needed
```

Keep the roles clear:

- The relational database is the source of truth.
- Redis is an acceleration layer, coordination layer, or short-lived state layer.
- Object storage holds images, attachments, and large files.
- Search engines and analytics systems are derived read models, not the primary truth.

If you are unsure, start with PostgreSQL or MySQL. That is usually safer than starting with several specialized stores. Specialized storage is useful when the problem is real: full-text search, time-series data, graph relationships, vector retrieval, high-throughput logs, or low-latency queues. Each choice has a cost.

## The Database Is The Source Of Truth

A database is not just "where the backend stores data." It is the system's memory.

In a project collaboration app, these facts belong in the database:

- Whether a user exists.
- Which organization owns a project.
- Which role a member has inside a project.
- Whether a task is closed.
- Whether a payment has been recorded.
- Whether an audit event was written.

These facts should not rely only on `if` statements in application code. Application code expresses business intent. Database constraints are the final guardrail.

## Model Business Invariants First

Do not start schema design from the page. Start from business invariants.

For a collaboration system:

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

The point is not the SQL syntax. The point is the constraints:

- `not null` means the business requires a value.
- `references` means the relationship must exist.
- `unique (organization_id, slug)` means a project slug cannot repeat inside one organization.
- `check` means the role belongs to a fixed set.
- The composite primary key means the same user cannot be added to the same project twice.

Constraints make the system slightly stricter and much more reliable. They stop bad data before it spreads into reports, cache, search indexes, and user-facing pages.

## Leave Room For Evolution

Some useful habits:

- Use stable IDs. Do not use mutable business fields as primary keys.
- Store money as integer minor units, or use an exact numeric database type. Do not use floating point.
- Store time in UTC and convert to the user's timezone at the edge.
- Make state machines explicit. Do not let arbitrary strings drift through the database.
- Think through soft delete with unique constraints, list filters, and restore rules.
- Use JSON for extension data, not as a replacement for core relationships.

JSON is useful, but it can erase structure. User preferences, raw third-party callbacks, and experiment settings can be JSON. Orders, memberships, permissions, and payment records should usually have explicit tables.

## Indexes Are Not Magic

An index is not there to make the schema look professional. It exists to help real queries avoid unnecessary work.

Start from the query:

```sql
select *
from projects
where organization_id = $1
  and archived_at is null
order by created_at desc
limit 20;
```

This query might need:

```sql
create index projects_org_active_created_idx
on projects (organization_id, created_at desc)
where archived_at is null;
```

Why not index every column?

- Indexes use disk space.
- Inserts, updates, and deletes must maintain indexes.
- Low-selectivity indexes might not help.
- Several single-column indexes are not the same as one good composite index.

The PostgreSQL documentation separates index types, multicolumn indexes, partial indexes, expression indexes, and covering indexes for a reason. Before shipping performance-sensitive queries, use `EXPLAIN` or `EXPLAIN (ANALYZE, BUFFERS)` instead of guessing.

A practical loop:

```text
1. Write down high-frequency queries.
2. Include sorting, pagination, and filters.
3. Prepare data close to production shape.
4. Use EXPLAIN ANALYZE to inspect scans, indexes, and expensive sorts.
5. Add or adjust indexes.
6. Measure write cost and read benefit again.
```

Index design is not a one-time task. It should evolve with real queries and slow-query logs.

## Transactions Wrap One Business Action

A transaction is not just syntax for running several SQL statements together. It is a reliability boundary around one business action.

Creating an order might look like this:

```text
begin
  create order
  reserve inventory
  create payment intent
  write audit event
commit
```

If something fails in the middle, either none of it happens, or the system enters a deliberate compensation path.

Useful rules:

- Keep transactions short. Do not wait for slow external APIs inside them.
- If data is read and then updated, think about concurrent writes.
- Unique constraints and idempotency keys are safer than "check first, insert later."
- High-concurrency inventory, seats, coupons, and counters need row locks, optimistic locking, or atomic updates.
- `Serializable` is not a magic safety switch. Stronger isolation often requires retry logic.

PostgreSQL's default `Read Committed` isolation level works for many ordinary cases, but complex read-write logic can need a stricter view, explicit locks, or a different write model. The key is knowing what this business action fears: duplicate writes, overselling, overwritten state, or inconsistent aggregates.

## Idempotency Matters More Than Retry

Real systems retry:

- Users double-click.
- Gateways replay timed-out requests.
- Payment providers resend webhooks.
- Queues deliver messages at least once.
- CI/CD or operations scripts run twice.

Critical actions need idempotency keys.

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

When a callback arrives, insert the event first. If the primary key conflicts, the event was already seen. Return success or run duplicate-event logic. This is far more reliable than remembering recent events in memory.

## Migrations Are Part Of Deployment

Database migrations affect whether production can start, whether the old app version can keep running, and whether the new app version can read old data.

A safe pattern is expand and contract:

```text
1. Expand
   Add compatible columns, tables, and indexes.

2. Deploy
   The app starts writing or reading the new shape while still supporting the old one.

3. Backfill
   Historical data is filled in controlled batches.

4. Switch
   The read path changes and metrics are watched.

5. Contract
   Old columns or old code are removed after the new path is stable.
```

Deployment rules:

- Commit migration files to version control.
- Do not edit migrations that have already been merged and applied.
- Keep development and production migration commands separate.
- Evaluate locks and duration for large-table changes.
- Know how to stop, recover, or compensate after migration failure.
- Coordinate application deploy order with schema changes.

With Prisma, `migrate dev` is for generating and applying migrations in development. Production and test environments should use `migrate deploy` to apply already-generated migrations. Do not run a development workflow against production and hope it behaves.

## Cache Is Not A Second Database

The most dangerous cache mistake is treating it as another source of truth.

A safer mental model:

```text
Database = source of truth
Cache = derived copy
```

Cache can disappear, expire, and be rebuilt. If losing the value makes the system unrecoverable, the value should not live only in cache.

Redis is a good fit for:

- High-frequency read caching.
- Session or short-lived state.
- Rate-limit counters.
- Short-term idempotency markers.
- Lightweight coordination.
- Simple queue or stream scenarios.

It should not automatically hold core transactional facts unless persistence, replication, failover, and data-loss windows are explicit decisions.

## Cache-aside Is The Common Starting Point

The most common business pattern is cache-aside:

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

It is simple because the application owns cache reads, database reads, cache writes, and invalidation.

It also has costs:

- The first read misses.
- If invalidation is wrong, users can see stale data.
- A hot key expiring can overload the database.
- Complex list cache can be hard to invalidate precisely.

So the question is not "Should we add Redis?" The better questions are:

- What exactly is cached?
- How long is it cached?
- Who invalidates it?
- How stale may it become?
- Can the database survive cache misses?
- What happens when key cardinality explodes?

## Define Consistency First

Different data needs different consistency.

Usually safe to cache:

- Homepage recommendations.
- Popular article lists.
- Product details that exclude inventory.
- User permission snapshots.
- Dictionary configuration.
- Expensive statistics that may be briefly stale.

Risky to casually cache:

- Account balances.
- Inventory deduction results.
- Final payment state.
- Strong permission checks immediately after a role change.

These are not impossible to cache. They just cannot be handled with "it will expire eventually." You need event-driven invalidation, short TTLs, versions, read/write-through strategies, or no cache on the critical path.

## Cache Keys Should Be Manageable

Cache keys should be readable, versioned, and invalidatable.

```text
project:v1:detail:{projectId}
project:v1:list:{organizationId}:{status}:{page}
user:v2:permissions:{userId}
rate-limit:v1:login:{ip}
```

Good conventions:

- Add a business prefix so modules do not collide.
- Add a version so structure changes can move to a new namespace.
- Sort parameters consistently so one query does not produce many keys.
- Design list cache and detail cache separately.
- Estimate cardinality and avoid unbounded high-cardinality keys.

If list cache becomes too complex, cache details first and let lists cache only IDs. Or optimize the database query and pagination before adding cache.

## TTL And Eviction Are Different Things

TTL is how long the business allows a cached value to live. Eviction is what Redis does when memory reaches a configured limit.

They solve different problems:

- TTL is a consistency and lifecycle policy.
- Eviction is capacity protection.

If a key must expire after five minutes, set a TTL. Waiting until Redis runs out of memory is not a business correctness strategy.

Redis `INFO stats` exposes metrics such as `keyspace_hits`, `keyspace_misses`, and `evicted_keys`. After cache ships, watch hit rate, miss spikes, evictions, and database pressure. Do not stop at "Redis is running."

## Common Failure Modes

### Caching Before Modeling

If the database model is unstable, cache only amplifies the problem. Make the query correct before making it fast.

### Write Succeeds, Cache Stays

This is one of the most common stale-data sources. Write paths must know which keys to delete. If keys cannot be targeted precisely, shorten TTLs, add event invalidation, or change cache granularity.

### Treating A Cache Lock As Full Safety

Redis can help with coordination, but distributed locks are not a universal answer. Many workflows are better handled with database unique constraints, row locks, optimistic locking, or idempotency keys.

### No Protection Against Penetration Or Stampede

Nonexistent data can be requested repeatedly. A hot key can expire and send many requests to the database at once.

Common mitigations:

- Cache empty results with a short TTL.
- Give hot keys a longer TTL or refresh them proactively.
- Coalesce identical cache-miss requests.
- Rate-limit abnormal traffic.

### Migrations And Cache Versions Drift Apart

The field shape changed, but old cache values remain. Use key versions, deployment-time prefix cleanup, or read logic that accepts both old and new shapes.

## How To Choose In Real Projects

A pragmatic table:

```text
Ordinary business system
  -> PostgreSQL / MySQL

Transactions, complex queries, admin workflows
  -> PostgreSQL / MySQL

High-frequency reads with acceptable staleness
  -> Redis cache-aside

Full-text search, complex filters, relevance ranking
  -> Elasticsearch / OpenSearch / Meilisearch

Event logs, audit, async processing
  -> database outbox + queue / stream

Large files, images, attachments
  -> object storage

Metrics, tracking, analytics
  -> analytics database or warehouse
```

Early systems should choose less. A reliable relational database plus a small amount of Redis can carry a product surprisingly far. Architecture is not a list of tools. It is putting complexity only where it has earned its place.

## Development-To-Launch Checklist

Design:

- Do tables express business facts?
- Are key invariants protected by database constraints?
- Are unique keys, foreign keys, and check constraints present where needed?
- Is the state machine clear?
- Is an audit log required?

Development:

- Do high-frequency queries have deliberate indexes?
- Are pagination and sorting stable?
- Are transaction boundaries short and clear?
- Are critical writes idempotent?
- Are cache keys and TTLs explainable?
- How does cache invalidation happen after writes?

Launch:

- Can migrations be applied repeatably?
- Have large-table changes been checked for lock and duration risk?
- Can the app version run before and after the schema change?
- Can backfills pause and retry?
- Are slow queries, cache hit rate, database connections, and evictions monitored?
- Is there a rollback or compensation path?

## The Final Rule

The relationship between database and cache is simple:

The database is responsible for correctness. Cache is responsible for speed.

When the system is small, do not rush into a complicated data layer. First make schema, constraints, indexes, transactions, migrations, and monitoring solid. When a real bottleneck appears, add cache, search, queues, read models, and analytics one layer at a time.

A good data layer does not look complicated for its own sake. It tells you where the truth lives, where the bottleneck is, and which next step can land safely.

## References

- [PostgreSQL Documentation: Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [PostgreSQL Documentation: Examining Index Usage](https://www.postgresql.org/docs/current/indexes-examine.html)
- [PostgreSQL Documentation: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- [PostgreSQL Documentation: Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Redis: Cache-aside pattern with Redis](https://redis.io/tutorials/howtos/solutions/microservices/caching/)
- [Redis Documentation: Key eviction](https://redis.io/docs/latest/develop/reference/eviction/)
- [Prisma Documentation: Development and production migrations](https://docs.prisma.io/docs/v6/orm/prisma-migrate/workflows/development-and-production)
