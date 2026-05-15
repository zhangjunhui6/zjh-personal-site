import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('software architecture topic articles', () => {
  it('publishes the frontend/backend architecture series in topic directories', async () => {
    const articles = await Promise.all([
      source('src/content/notes/software/architecture/frontend-backend-architecture-map.md'),
      source('src/content/notes/software/architecture/api-contract-collaboration-guide.md'),
      source('src/content/notes/software/frontend/frontend-engineering-architecture-guide.md'),
      source('src/content/notes/software/backend/backend-architecture-practical-guide.md'),
      source('src/content/notes/software/backend/database-cache-practical-guide.md'),
      source('src/content/notes/software/backend/auth-access-control-practical-guide.md'),
      source('src/content/notes/software/devops/observability-reliability-practical-guide.md'),
      source('src/content/notes/software/devops/harness-cicd-delivery-guide.md'),
    ]);

    assert.match(articles[0], /translationKey: software\/architecture\/frontend-backend-architecture-map/);
    assert.match(articles[0], /draft: false/);
    assert.match(articles[0], /## 先看一张系统地图/);
    assert.match(articles[0], /React Server Components/);
    assert.match(articles[0], /OpenTelemetry Observability Primer/);

    assert.match(articles[1], /translationKey: software\/architecture\/api-contract-collaboration-guide/);
    assert.match(articles[1], /draft: false/);
    assert.match(articles[1], /## API 契约包含什么/);
    assert.match(articles[1], /## 错误格式要稳定/);
    assert.match(articles[1], /OpenAPI Specification explained/);

    assert.match(articles[2], /translationKey: software\/frontend\/frontend-engineering-architecture-guide/);
    assert.match(articles[2], /draft: false/);
    assert.match(articles[2], /## 前端架构解决什么问题/);
    assert.match(articles[2], /## 数据获取和缓存/);
    assert.match(articles[2], /web\.dev Core Web Vitals/);

    assert.match(articles[3], /translationKey: software\/backend\/backend-architecture-practical-guide/);
    assert.match(articles[3], /draft: false/);
    assert.match(articles[3], /## 后端架构解决什么问题/);
    assert.match(articles[3], /## API 设计/);
    assert.match(articles[3], /PostgreSQL Documentation/);

    assert.match(articles[4], /translationKey: software\/backend\/database-cache-practical-guide/);
    assert.match(articles[4], /draft: false/);
    assert.match(articles[4], /## 数据库是事实来源/);
    assert.match(articles[4], /## 索引不是越多越好/);
    assert.match(articles[4], /Redis: Cache-aside pattern with Redis/);

    assert.match(articles[5], /translationKey: software\/backend\/auth-access-control-practical-guide/);
    assert.match(articles[5], /draft: false/);
    assert.match(articles[5], /## 先分清三个概念/);
    assert.match(articles[5], /## 授权必须在服务端执行/);
    assert.match(articles[5], /OWASP Authorization Cheat Sheet/);

    assert.match(articles[6], /translationKey: software\/devops\/observability-reliability-practical-guide/);
    assert.match(articles[6], /draft: false/);
    assert.match(articles[6], /## 三类核心信号/);
    assert.match(articles[6], /## SLI、SLO 和错误预算/);
    assert.match(articles[6], /OpenTelemetry Signals/);

    assert.match(articles[7], /translationKey: software\/devops\/harness-cicd-delivery-guide/);
    assert.match(articles[7], /draft: false/);
    assert.match(articles[7], /## Harness 的核心心智模型/);
    assert.match(articles[7], /## Feature Flags：把 deploy 和 release 拆开/);
    assert.match(articles[7], /Harness Continuous Delivery overview/);
  });

  it('keeps English article pairs for the published software series', async () => {
    const articles = await Promise.all([
      source('src/content/notes/software/architecture/frontend-backend-architecture-map-en.md'),
      source('src/content/notes/software/architecture/api-contract-collaboration-guide-en.md'),
      source('src/content/notes/software/frontend/frontend-engineering-architecture-guide-en.md'),
      source('src/content/notes/software/backend/backend-architecture-practical-guide-en.md'),
      source('src/content/notes/software/backend/database-cache-practical-guide-en.md'),
      source('src/content/notes/software/backend/auth-access-control-practical-guide-en.md'),
      source('src/content/notes/software/devops/observability-reliability-practical-guide-en.md'),
      source('src/content/notes/software/devops/harness-cicd-delivery-guide-en.md'),
    ]);

    assert.match(articles[0], /lang: en/);
    assert.match(articles[0], /translationKey: software\/architecture\/frontend-backend-architecture-map/);
    assert.match(articles[0], /draft: false/);

    assert.match(articles[1], /lang: en/);
    assert.match(articles[1], /translationKey: software\/architecture\/api-contract-collaboration-guide/);
    assert.match(articles[1], /draft: false/);

    assert.match(articles[2], /lang: en/);
    assert.match(articles[2], /translationKey: software\/frontend\/frontend-engineering-architecture-guide/);
    assert.match(articles[2], /draft: false/);

    assert.match(articles[3], /lang: en/);
    assert.match(articles[3], /translationKey: software\/backend\/backend-architecture-practical-guide/);
    assert.match(articles[3], /draft: false/);

    assert.match(articles[4], /lang: en/);
    assert.match(articles[4], /translationKey: software\/backend\/database-cache-practical-guide/);
    assert.match(articles[4], /draft: false/);

    assert.match(articles[5], /lang: en/);
    assert.match(articles[5], /translationKey: software\/backend\/auth-access-control-practical-guide/);
    assert.match(articles[5], /draft: false/);

    assert.match(articles[6], /lang: en/);
    assert.match(articles[6], /translationKey: software\/devops\/observability-reliability-practical-guide/);
    assert.match(articles[6], /draft: false/);

    assert.match(articles[7], /lang: en/);
    assert.match(articles[7], /translationKey: software\/devops\/harness-cicd-delivery-guide/);
    assert.match(articles[7], /draft: false/);
  });
});
