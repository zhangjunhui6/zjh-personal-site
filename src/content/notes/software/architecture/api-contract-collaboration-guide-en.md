---
title: "Turning APIs Into Contracts: A Frontend-Backend Collaboration Guide"
description: A practical API contract guide covering REST, OpenAPI, errors, pagination, authentication, compatibility, and frontend-backend delivery workflow.
date: 2026-05-15
tags: [Architecture, API, Frontend, Backend]
lang: en
translationKey: software/architecture/api-contract-collaboration-guide
draft: false
---

The hardest part of frontend-backend collaboration is not calling an endpoint. It is making the API a contract.

Without a contract, the API becomes a chat history:

- Can this field be null?
- What does failure return?
- Does pagination start at 0 or 1?
- Should delete return 200, 204, or 404?
- Is missing permission 401 or 403?
- How does the frontend learn about a field change?

If every answer depends on temporary conversation, the project becomes slower as it grows.

An API contract lets frontend, backend, testing, documentation, and monitoring work around the same facts.

## What An API Contract Contains

A useful API contract includes:

- URL and HTTP method.
- Path parameters, query parameters, and body.
- Response body.
- Error shape.
- Status code semantics.
- Authentication requirements.
- Pagination, sorting, and filtering rules.
- Nullability rules.
- Compatibility policy.
- Example requests and responses.

This is where OpenAPI helps. It describes APIs in a machine-readable format so documentation, code generation, mock servers, tests, and reviews can use the same description.

## Start With Resources And Actions

A common REST API failure is designing URLs around screens or buttons instead of resources and business actions.

Start with resources:

```text
projects
users
orders
invoices
articles
```

Then define basic operations:

```text
GET /projects
GET /projects/:id
POST /projects
PATCH /projects/:id
DELETE /projects/:id
```

Then add business actions:

```text
POST /projects/:id/archive
POST /orders/:id/cancel
POST /articles/:id/publish
```

Do not force every business action into CRUD for the sake of purity. State transitions such as `publish`, `archive`, and `cancel` are often clearer as explicit action endpoints.

## HTTP Methods

Common meanings:

```text
GET
  -> retrieve a resource without changing state

POST
  -> create a resource or execute a non-idempotent action

PATCH
  -> partially update a resource

PUT
  -> replace a resource

DELETE
  -> delete a resource
```

The frontend cares about behavior, not only names:

- Can `GET` be cached?
- Can repeated `POST` create duplicates?
- Does `PATCH` send only changed fields or the whole object?
- After `DELETE`, should the frontend remove the item locally or refetch the list?

Those answers belong in the contract.

## Status Codes Should Mean Something

Status codes should help the client decide what to do next.

Useful defaults:

```text
200 OK
  -> success with a response body

201 Created
  -> resource created

204 No Content
  -> success with no response body

400 Bad Request
  -> malformed or invalid request

401 Unauthorized
  -> not signed in or credentials invalid

403 Forbidden
  -> signed in but not allowed

404 Not Found
  -> resource missing or invisible to this user

409 Conflict
  -> state conflict, duplicate name, version conflict

422 Unprocessable Content
  -> semantic validation failure, often field validation

429 Too Many Requests
  -> rate limited

500 Internal Server Error
  -> unknown server failure
```

Do not return 200 for every error and put `success: false` in the body. That removes useful HTTP semantics from caches, gateways, monitoring, SDKs, and browser tooling.

## Error Shape Must Be Stable

The frontend suffers when every endpoint invents a different error shape.

A simple default:

```json
{
  "code": "PROJECT_NAME_TAKEN",
  "message": "Project name already exists.",
  "fields": {
    "name": "This name is already used."
  },
  "requestId": "req_01HY..."
}
```

Meaning:

- `code`: frontend branching and translation.
- `message`: user-facing or fallback copy.
- `fields`: form field errors.
- `requestId`: log and trace lookup.

For more complex cases:

```json
{
  "code": "PAYMENT_PROVIDER_TIMEOUT",
  "message": "Payment service is temporarily unavailable. Please try again later.",
  "retryable": true,
  "requestId": "req_01HY..."
}
```

Stability matters more than perfection. The frontend should not need custom error parsing for every endpoint.

## Pagination, Sorting, And Filtering

Pagination should be decided early because it is hard to change later.

### Offset Pagination

```text
GET /projects?page=1&pageSize=20
```

Good for admin lists, small or medium data sets, and jump-to-page UI.

Response:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 238
}
```

### Cursor Pagination

```text
GET /events?cursor=eyJpZCI6...&limit=20
```

Good for timelines, infinite scroll, large data sets, and realtime append-heavy lists.

Response:

```json
{
  "items": [],
  "nextCursor": "eyJpZCI6...",
  "hasMore": true
}
```

Sorting and filtering should also be consistent:

```text
GET /projects?status=active&sort=-createdAt
```

The frontend needs to know:

- Which filters exist.
- Which sort fields exist.
- What the default sort is.
- How unsupported parameters fail.

## Field Names And Nullability

Field naming must be consistent.

Common JSON style:

```json
{
  "createdAt": "2026-05-15T10:00:00.000Z",
  "ownerId": "user_123"
}
```

Or:

```json
{
  "created_at": "2026-05-15T10:00:00.000Z",
  "owner_id": "user_123"
}
```

Either can work. Mixing them is the problem.

Nullability should also be explicit:

- What does a missing field mean?
- What does `null` mean?
- Is an empty array different from `null`?
- Are times ISO strings or timestamps?
- Are money amounts minor units or decimals?

These details directly affect frontend types, default form values, and rendering logic.

## Authentication And Authorization

Authentication answers "who are you." Authorization answers "what can you do."

The contract should state:

- Which endpoints require sign-in.
- Whether auth uses cookie sessions or bearer tokens.
- How token expiration appears.
- What insufficient permission returns.
- Whether invisible resources return 403 or 404.

Useful conventions:

```text
401
  -> not signed in, token expired, credentials invalid

403
  -> signed in but not allowed

404
  -> resource missing or intentionally hidden
```

The frontend uses this to decide whether to redirect to sign-in, show an access-denied state, or show not-found.

## Compatibility

APIs change. A useful contract allows evolution.

Usually safe:

- Adding response fields.
- Adding optional request fields.
- Adding endpoints.
- Adding error codes while keeping generic fallback behavior.

Risky:

- Removing fields.
- Changing field types.
- Changing field meaning.
- Adding required request fields.
- Changing error shape.

For breaking changes:

```text
/v2/projects
Accept: application/vnd.example.v2+json
parallel endpoint during migration
feature flag controlling client migration
```

Small teams may not need a large versioning system. They still need an agreement for changing APIs without breaking the frontend.

## Using OpenAPI Well

OpenAPI should not only generate pretty docs.

I would use it like this:

1. Describe core endpoints first.
2. Review API changes in pull requests.
3. Generate docs or a mock server.
4. Generate frontend types or SDKs.
5. Use contract tests to keep implementation and description aligned.

A minimal OpenAPI fragment:

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

The goal is not to document everything perfectly on day one. The goal is to make API changes reviewable and automatable.

## REST, GraphQL, Or RPC

### REST

Fits most business systems. Resource boundaries are clear, HTTP tooling is mature, and debugging is straightforward.

### GraphQL

Fits multi-client products where the frontend needs flexible field selection. The cost is schema design, permissions, caching, N+1 query management, and complexity governance.

### RPC / tRPC

Fits small teams using the same language across frontend and backend. Developer experience is strong. Cross-language, cross-team, and public API cases can be harder.

Do not change protocol because it is fashionable. Decide based on team shape, number of clients, type constraints, debugging cost, and long-term maintenance.

## Collaboration Workflow

A healthy frontend-backend workflow:

```text
requirement alignment
  -> API draft
  -> frontend/backend review
  -> mock / contract
  -> frontend implementation in parallel
  -> backend implementation
  -> contract test
  -> staging integration
  -> release
```

Do not wait until the backend is fully implemented before frontend work starts. Do not make the frontend guess fields.

Better workflow: contract first, mock first, real implementation later.

## Pre-Release Checklist

Before shipping an API, check:

- URL and method are stable.
- Request fields are validated.
- Response fields have examples.
- Error codes are clear.
- Pagination, sorting, and filtering are consistent.
- Authentication and authorization are covered.
- Request ID exists.
- Logs and monitoring exist.
- Idempotency and duplicate submission are considered.
- Compatibility notes are written.
- Documentation or OpenAPI is updated.

This checklist is simple, but it removes a lot of integration rework.

## Summary

An API contract turns "I thought you would return this" into "we agreed the system returns this."

The frontend needs stable fields, error structures, and status semantics. The backend needs clear business boundaries, permissions, and evolution rules. Testing and operations need request IDs, logs, and observability.

When APIs become contracts instead of temporary conversations, frontend and backend work can move in parallel.

## Further Reading

- [OpenAPI Specification explained](https://learn.openapis.org/specification/)
- [OpenAPI Specification v3.0.0](https://spec.openapis.org/oas/v3.0.0.html)
- [MDN HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [JSON:API specification](https://jsonapi.org/format/)
- [GraphQL schema documentation](https://graphql.org/learn/schema/)
