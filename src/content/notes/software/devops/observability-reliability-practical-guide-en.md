---
title: "Running With The Lights On: A Practical Guide To Observability And Reliability"
description: A practical guide to logs, metrics, traces, alerting, SLOs, error budgets, incident review, and launch checks for real production systems.
date: 2026-05-15
tags: [DevOps, Observability, Reliability, Architecture]
lang: en
translationKey: software/devops/observability-reliability-practical-guide
draft: false
---

The real work starts after a system goes live.

If it runs locally, tests pass, and deployment succeeds, that only means code reached production. It does not prove users are fine, payments are succeeding, queues are not backing up, cache is not collapsing, or the database is not near a cliff.

Observability and reliability help a team answer three questions continuously:

- Is the system healthy right now?
- If not, where is the problem?
- How do we make it less likely to fail the same way again?

Without observability, production is driving with the lights off. You might keep moving for a while, but every turn is a bet.

## Monitoring And Observability

Monitoring is like a fixed dashboard: you already know what you want to watch.

```text
CPU usage
memory usage
HTTP 500 rate
database connections
queue length
```

Observability is investigation ability: you may not know the problem ahead of time, but the system leaves enough signals for you to follow.

```text
Why was this request slow?
Which dependency is failing most?
Why does one user keep getting 403?
Did the latest release affect only one region?
Was a payment callback processed twice?
```

Monitoring answers whether known problems happened. Observability helps investigate why unknown problems happened.

## Three Core Signals

OpenTelemetry describes telemetry signals such as traces, metrics, and logs. In everyday engineering:

```text
Metrics
  -> numbers over time

Logs
  -> what happened at a moment

Traces
  -> the path one request took through the system
```

They do not replace one another.

Metrics are good for trends and alerts. Logs are good for details. Traces are good for request paths.

A healthy debugging flow often looks like:

```text
alert fires
  -> dashboard sees error rate rising
  -> trace shows slow dependency
  -> logs show specific error code and requestId
  -> runbook tells operator what to check next
```

## Define Reliability From User Experience

Reliability should not be defined only from the server's point of view.

Users care about:

- Can the page open?
- Did the action succeed?
- Was data lost?
- Was the response fast enough?
- Are critical paths such as payment, registration, submit, and search available?

So do not start only with CPU. CPU matters, but healthy CPU does not prove healthy users.

A better starting point is the critical user journey:

```text
login
create project
submit order
complete payment
upload file
search content
open dashboard
```

Then define success rate, latency, and error types for each journey.

## SLI, SLO, And Error Budget

Google SRE commonly organizes reliability with three concepts:

```text
SLI: Service Level Indicator
  -> the measured signal

SLO: Service Level Objective
  -> the target the team wants to meet

Error budget
  -> the allowed failure space during a period
```

Example:

```text
SLI
  -> successful 2xx / 3xx responses for /api/orders

SLO
  -> 99.9% of order creation requests succeed over 30 days

Error budget
  -> 0.1% of requests may fail
```

The value of an SLO is not the impressive number. It helps the team make tradeoffs.

If error budget remains healthy, the team can keep shipping. If the budget is nearly gone, reliability work should take priority: slower releases, slow-query fixes, idempotency, rate limiting, rollback improvements.

Reliability is not "never fail." Reliability is knowing how much risk the system may take and stopping before that risk gets out of control.

## Designing Metrics

Do not collect everything first. Design metrics by layer.

### User-Level Metrics

```text
page load time
checkout success rate
login success rate
search latency
file upload success rate
```

These are closest to user experience.

### API-Level Metrics

```text
request count
error rate
latency p50 / p95 / p99
status code distribution
rate limit count
```

An HTTP service should at least be observable by route, method, and status class. But labels cannot grow without limit. Do not put userId, email, or full URL into metric labels.

### Dependency Metrics

```text
database query latency
database connection pool usage
redis hit rate
redis evicted keys
queue depth
third-party API error rate
```

Dependency metrics help distinguish application code, database, cache, queue, and third-party failures.

### Resource Metrics

```text
CPU
memory
disk
network
container restarts
```

These help debug capacity and infrastructure. They should usually not be the only business alert source.

## Logs Should Be Structured

Logs should not be text meant only for someone scrolling in a terminal. They should be queryable, aggregatable, and linkable.

A useful application log includes:

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

Principles:

- Use structured JSON, not only string concatenation.
- Give every request a `requestId`.
- Add `traceId` when tracing is available.
- Use stable `errorCode` values.
- Do not log passwords, tokens, secrets, or full card numbers.
- Be disciplined with log levels.

The point of logs is not "more lines." The point is that one `requestId` can connect the request entrypoint, service logs, database operation, downstream call, and frontend error.

## Traces Solve Path Problems

When a system has one service, logs can often be enough. Once there is frontend, API, database, cache, queues, and third-party APIs, logs alone make it hard to know where one request slowed down.

Tracing follows one request:

```text
HTTP POST /orders
  -> auth middleware
  -> order service
  -> database insert
  -> payment provider
  -> outbox event
  -> response
```

Each step is a span. The whole path is a trace.

Traces help:

- See which components a request crossed.
- Measure each component's duration.
- Find slow or failing spans.
- Correlate logs and metrics.
- Preserve context across microservices or async workflows.

OpenTelemetry matters because it provides a vendor-neutral standard for collecting and exporting telemetry. You can instrument with OpenTelemetry SDKs or auto-instrumentation, then export through a collector to different backends.

## Frontend Needs Observability Too

The frontend is not fine just because the backend did not log an error.

Frontend observability should include:

- Page load time.
- Core Web Vitals.
- JavaScript errors.
- API request failures.
- Failed user actions.
- Blank screens and asset failures.
- Critical-flow conversion.

A frontend error event should include:

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

If frontend errors can connect to backend request IDs or trace IDs, debugging becomes much faster.

## Alerts Should Be Few And Sharp

More alerts do not mean more safety. Too many alerts make people numb.

A good alert should:

- Mean users are affected, or soon will be.
- Have a clear owner.
- Have a clear action.
- Have a runbook.
- Avoid waking people for short harmless blips.

Weak alert:

```text
CPU > 80% for 1 minute
```

Better alert:

```text
checkout_success_rate < 99.5% for 10 minutes
and request_count > minimum_traffic_threshold
```

Prometheus alerting rules define conditions with expressions, then Alertmanager handles routing, grouping, and notification. The tool is not the point. The alert must connect user impact, business goals, and response actions.

## Dashboards Should Serve Scenarios

A dashboard is not a display wall.

Each dashboard should answer one question:

```text
Is the whole system healthy?
Is the order flow broken?
Is the database the bottleneck?
Did the latest release introduce errors?
Is one tenant behaving abnormally?
```

A generic service dashboard can include:

- Request volume.
- Error rate.
- p50 / p95 / p99 latency.
- Saturation: connection pool, queue, CPU, memory.
- Downstream dependency error rate and latency.
- Recent release markers.
- Active alerts.

Do not put every graph onto one page. During an incident, the worst dashboard is one with many charts and no answer about the next place to look.

## Runbooks Capture Experience

Every alert should have a runbook.

A runbook does not need to be a novel, but it should answer:

- What does this alert mean?
- Which users or business paths may be affected?
- Which dashboards should be checked first?
- What are common causes?
- Which actions are safe?
- When should this be escalated?
- How do we confirm recovery?

Short template:

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

The value of a runbook is that the person awake at 3 a.m. does not have to rely on memory.

## Incident Flow

Production incidents should not be managed only through chat.

A basic flow:

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

Useful roles:

- Incident lead: controls pace and decisions.
- Investigator: finds the cause.
- Operator: rolls back, flips flags, scales, or runs safe actions.
- Communicator: keeps internal and external stakeholders updated.

During an incident, the priority is not proving who made a mistake. The priority is stopping the bleeding. Root causes and system improvements come during review.

## Blameless But Specific Review

A good incident review is not "everyone be more careful."

It should produce specific improvements:

- Which alert was late.
- Which dashboard missed a chart.
- Which runbook was incomplete.
- Which rollback step was untested.
- Which migration risk was missed.
- Which permission or idempotency rule lacked a test.

Useful structure:

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

Blameless does not mean responsibility-free. It means treating the failure as a system problem instead of stopping at human error.

## Releases Need Observability

Every release should leave marks in the observability system.

At minimum, record:

- release version.
- commit SHA.
- deploy time.
- environment.
- feature flag state.
- whether migrations ran.
- rollback events.

After release, watch:

- Did error rate rise?
- Did p95 / p99 latency get worse?
- Did critical business success rates drop?
- Did frontend errors increase?
- Is the issue isolated to one tenant, region, or browser?

If you use canary releases or feature flags, observability dimensions should include version, flag, region, and tenant where appropriate. Otherwise canary is just "increase the blast radius slowly," not controlled release.

## How To Land This In Real Projects

### Stage 1: Monolith Or Small Team

Start with:

- Structured logs.
- Request ID.
- HTTP request volume, error rate, and latency.
- Database connection pool and slow queries.
- Basic uptime check.
- Critical-path failure alerts.

Do not start by building a huge platform. First make sure the team can answer "who failed, why did it fail, and was there a recent release?"

### Stage 2: More Services

Add:

- OpenTelemetry tracing.
- traceId in logs.
- Service dependency map.
- Shared dashboards.
- Runbooks.
- Release markers.
- Queue, cache, and third-party dependency metrics.

Debugging shifts from "why did one service fail?" to "where did the request break in the system?"

### Stage 3: Mature Product

Then add:

- SLOs and error budgets.
- User journey metrics.
- Incident process.
- On-call rotation.
- Capacity planning.
- Chaos testing or fault injection.
- Cost and telemetry retention policy.

A mature system is not just a bigger tool stack. Reliability enters product and engineering decisions.

## Launch Checklist

Application:

- Does every request have a requestId?
- Do errors have stable errorCode values?
- Are logs structured?
- Is sensitive information excluded from logs?
- Can slow endpoints be tied to route and dependency?

Metrics:

- Are request volume, error rate, latency, and saturation tracked?
- Are critical user journey success rates tracked?
- Are database, cache, queue, and third-party dependency metrics present?
- Do metric labels avoid high cardinality?

Tracing:

- Do entry requests create traces?
- Are downstream HTTP, database, and queue spans connected?
- Do logs include traceId?
- Is sampling reasonable?

Alerting:

- Does the alert correspond to user impact?
- Is there a runbook?
- Is there an owner?
- Does it avoid short blips?
- Does it cover critical paths after release?

Process:

- Are releases marked with versions?
- Has rollback been tested?
- Do incidents have an owner and timeline?
- Do review action items have owners and due dates?

## The Final Rule

Observability is not for pretty dashboards. Reliability is not the myth of a system that never breaks.

Together, they solve a practical problem: systems fail, and the team needs to detect quickly, mitigate safely, review honestly, and improve specifically.

When a system has stable metrics, searchable logs, connected traces, sharp alerts, executable runbooks, and honest reviews, it is no longer just deployed code. It becomes a product that can be operated, maintained, and trusted.

## References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [OpenTelemetry Signals](https://opentelemetry.io/docs/concepts/signals/)
- [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE Book: Embracing Risk](https://sre.google/sre-book/embracing-risk/)
- [Prometheus: Alerting rules](https://prometheus.io/docs/prometheus/2.53/configuration/alerting_rules/)
- [Prometheus: Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Grafana Documentation: About metrics and telemetry](https://grafana.com/docs/grafana/latest/visualizations/simplified-exploration/metrics/about-metrics/)
