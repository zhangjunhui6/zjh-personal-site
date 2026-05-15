---
title: "Putting Doors Into Software: A Practical Guide To Auth And Access Control"
description: A practical guide to login, sessions, cookies, JWT, OAuth, RBAC, resource-level authorization, frontend/backend collaboration, and launch checks.
date: 2026-05-15
tags: [Backend, Security, Authorization, Architecture]
lang: en
translationKey: software/backend/auth-access-control-practical-guide
draft: false
---

Authentication and authorization systems are easy to underestimate.

They can look like "add a login page" and "check whether the user is an admin." After launch, they become the building's front door, elevator card, room key, and audit trail.

A mature system needs to answer:

- Who are you?
- Is this request still trustworthy?
- Can you access this resource?
- Can you perform this action?
- When permissions change, how quickly do they apply?
- When an access violation happens, can we explain who did what and why?

This guide maps the auth and access-control decisions that matter in everyday web applications.

## Separate Three Concepts

Authentication, session management, and authorization are related, but they are not the same thing.

```text
Authentication
  -> prove who you are

Session management
  -> remember you across stateless HTTP requests

Authorization
  -> decide what you are allowed to do
```

Example:

```text
User submits email and password
  -> authentication

Server issues a session cookie
  -> session management

User opens /projects/123/settings
  -> authorization
```

Successful login does not mean the user can do everything. A logged-in member still should not be able to delete an organization, view another account's invoices, or change admin roles.

## A Safe Default

Many ordinary web apps can start here:

```text
Browser
  -> HttpOnly + Secure + SameSite cookie
  -> Backend session store
  -> User / Role / Permission tables
```

In practice:

- Store login state in a server-side session.
- Give the browser a session cookie that JavaScript cannot read.
- Resolve the current user from the session on every request.
- Make authorization decisions on the backend.
- Let the frontend handle display and navigation, not final security.

This is not the only valid design, but it is a good starting point for many business applications. It is simple, revocable, debuggable, and practical for logout, forced sign-out, and permission changes.

When should you consider JWT?

- Mobile clients or third-party APIs need bearer tokens.
- Services need to pass short-lived access tokens.
- The system really needs stateless validation.
- The authorization server and resource server are separate.

When should you consider OAuth / OpenID Connect?

- You need Google, GitHub, or enterprise SSO.
- You do not want to store user passwords.
- Third-party apps need delegated access.
- Login should be handled by an identity provider.

Do not choose JWT just because it feels modern. OWASP's JWT guidance notes that if an application does not need to be fully stateless, a traditional session system is often worth considering.

## Designing Login

A basic login flow:

```text
POST /auth/login
  -> validate credentials
  -> check account status
  -> optional MFA / risk challenge
  -> create session
  -> set session cookie
  -> return current user summary
```

The response can be:

```json
{
  "user": {
    "id": "user_123",
    "name": "Jun",
    "roles": ["member"]
  }
}
```

Important details:

- Login failures should not reveal "email exists but password is wrong."
- Passwords must be stored with password-specific hashing, not plaintext or ordinary hashes.
- Rotate the session after login to prevent session fixation.
- Require reauthentication or MFA for sensitive actions.
- Audit login, logout, password changes, and MFA changes.

Authentication does not only happen on the login page. Password changes, data exports, organization deletion, and payment-method changes may need fresh identity confirmation.

## Cookie Configuration

For browser apps, a session cookie should generally look like:

```http
Set-Cookie: __Host-session=...; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600
```

Meaning:

- `Secure`: send only over HTTPS.
- `HttpOnly`: JavaScript cannot read it through `document.cookie`.
- `SameSite=Lax`: reduce cross-site cookie sending.
- `Path=/`: scope the cookie path.
- `__Host-`: requires no `Domain`, plus `Path=/` and `Secure`, which reduces scoping mistakes.

If frontend and backend are deployed cross-site, cookies, CORS, and CSRF become more complicated at the same time. Many projects avoid that complexity by putting the app and API under the same site:

```text
app.example.com
app.example.com/api
```

or:

```text
example.com
example.com/api
```

Cross-site cookies can work, but you need to understand `SameSite=None; Secure`, CORS credentials, CSRF protection, and local HTTPS development.

## Sessions Should Be Revocable

One major advantage of server-side sessions is control.

A practical session table:

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

Do not store the raw session token in the database. A safer approach:

```text
cookie contains random session token
database stores hash(session token)
```

If the database leaks, attackers still cannot directly use the token.

Sessions should support:

- Expiration.
- Renewal.
- Revocation on logout.
- Revocation after password change.
- Forced sign-out by admins.
- Reauthentication after suspicious activity.

OWASP's Session Management guide treats the session ID as highly sensitive because once a user is logged in, the session ID temporarily represents that user's authenticated state.

## JWT Done Carefully

JWTs are self-contained, signed, and easy to pass between services. The downside comes from the same property: once issued, they can be hard to revoke without extra design.

A common pattern:

```text
access token
  -> short-lived, minutes to tens of minutes
  -> used for API access

refresh token
  -> longer-lived, but revocable and rotated
  -> used only to get a new access token
```

JWT validation must do more than parse the token. At minimum, validate:

- Signature algorithm and key.
- `iss`, the issuer.
- `aud`, the audience.
- `exp`, expiration.
- `nbf`, not-before time.
- `sub`, the user or subject.
- `jti`, when tracking or revocation is needed.

Do not put sensitive data in a JWT payload. JWT is usually encoded and signed, not encrypted. Browsers, logs, proxies, and debugging tools can expose its contents.

For browser applications, avoid long-lived tokens in `localStorage` when possible. If XSS happens, an attacker can read and exfiltrate them. HttpOnly cookies do not solve every problem, but they do stop JavaScript from directly reading the session value.

## Think About CSRF And XSS Together

With cookie-based login, CSRF matters: can an attacker cause the user's browser to send authenticated requests to your API?

Common defenses:

- `SameSite=Lax` or `SameSite=Strict`.
- CSRF tokens for write operations.
- `Origin` / `Referer` checks.
- Reauthentication for sensitive actions.
- Accepting only explicit JSON `Content-Type` for APIs.

With bearer tokens, CSRF risk is usually lower because browsers do not automatically attach Authorization headers to cross-site requests. But if the token lives somewhere JavaScript can read, XSS risk rises.

So the decision is not just "cookie or token." Look at:

- Can scripts read the token?
- Will the browser attach it automatically?
- Can cross-site requests trigger writes?
- Do sensitive actions have a second check?

## Authorization Belongs On The Server

Hiding a button in the frontend is user experience, not access control.

Real authorization must happen on the backend:

```text
request
  -> authenticate user
  -> load resource
  -> check permission
  -> execute action
```

Avoid this as a long-term model:

```text
if user.role == "admin":
  allow
```

It looks fine early, but product rules quickly become:

- Organization admins can only manage their own organization.
- Project owners can delete projects; maintainers can update settings.
- Billing admins can view invoices but cannot change member roles.
- Support staff can view user profiles but cannot export sensitive data.
- Users can only access resources connected to their memberships.

Authorization should be framed around resources and actions:

```text
can(user, "project.delete", project)
can(user, "billing.invoice.read", organization)
can(user, "member.invite", project)
```

This makes code read like business policy instead of scattered role checks.

## RBAC, ABAC, And Relationships

Three common permission models:

### RBAC

Role-Based Access Control.

```text
owner
maintainer
viewer
billing_admin
```

This is a good starting point for most admin tools and SaaS products. It is understandable and manageable, but roles can grow too many edges over time.

### ABAC

Attribute-Based Access Control.

```text
if user.department == resource.department
if user.region == "CN" and order.region == "CN"
if document.classification <= user.clearance
```

Useful when organizational rules depend on many attributes. The cost is harder debugging.

### ReBAC

Relationship-Based Access Control.

```text
user is member of project
project belongs to organization
organization owns invoice
```

Useful for collaboration tools, organization trees, document permissions, and team spaces.

Real systems often mix them:

```text
roles define broad abilities
resource relationships decide which object is accessible
attributes apply special restrictions
```

## Data Model

A simple RBAC plus relationship model:

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

A permission function can be centralized:

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

This is only a sketch. Real systems may move policy into tables, config files, or a policy engine. Whatever the abstraction, the goal is the same: authorization should be centralized, testable, and auditable.

## Multi-Tenant Access Is Special

Cross-tenant access is one of the most common SaaS security failures.

Risky query:

```sql
select * from projects where id = $1;
```

Safer query:

```sql
select p.*
from projects p
join organization_members m on m.organization_id = p.organization_id
where p.id = $1
  and m.user_id = $2;
```

Or enforce tenant scope in the service layer:

```text
getProject({ projectId, organizationId, userId })
```

Do not load a resource by ID and then perform authorization far away as an afterthought. The closer resource loading and permission checks are, the harder they are to forget.

## What The Frontend Should Do

The frontend is not the security boundary, but it has important experience responsibilities.

The frontend should:

- Hide unavailable actions based on current capabilities.
- Redirect to login or refresh the session on 401.
- Show a no-access state on 403.
- Refetch after permission changes.
- Avoid storing sensitive tokens in long-lived script-readable storage.
- Avoid treating client state as the final permission truth.

The frontend should not:

- Protect data only with route guards.
- Rely on hidden buttons to block dangerous operations.
- Treat `isAdmin=true` as a trusted decision.
- Duplicate backend authorization as a second inconsistent system.

A good collaboration pattern is for the backend to return a current-user capability summary:

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

The frontend uses this for experience. The backend still checks every sensitive endpoint.

## API Status Codes

Separate authentication and authorization failures:

```text
401 Unauthorized
  -> you are not logged in, or the session is invalid

403 Forbidden
  -> you are logged in, but not allowed

404 Not Found
  -> the resource does not exist, or it is hidden to avoid leaking existence
```

In multi-tenant systems, returning 404 for inaccessible resources can be reasonable to avoid revealing existence. But the team needs one convention, or debugging and frontend behavior become messy.

Use a stable error shape:

```json
{
  "code": "PROJECT_ACCESS_DENIED",
  "message": "You do not have access to this project.",
  "requestId": "req_01HY..."
}
```

## Audit Logs Are Not Optional Later

Without audit logs, access-control incidents are hard to investigate.

At minimum, record:

- Login success and failure.
- Logout.
- Password changes.
- MFA enable, disable, and reset.
- Role changes.
- Member invitations and removals.
- High-risk resource reads.
- Delete, export, payment, and key-creation actions.

An audit event should include:

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

Do not log passwords, tokens, or secrets in plaintext. Logs help investigation; they should not become another leak surface.

## Launch Checklist

Authentication:

- Are passwords hashed with a password-storage algorithm?
- Do login failures avoid account enumeration?
- Is there rate limiting and suspicious-login monitoring?
- Is MFA or reauthentication available for high-risk actions?
- Are old sessions revoked after password changes?

Sessions:

- Are cookies `Secure`, `HttpOnly`, and `SameSite`?
- Can sessions expire, renew, revoke, and rotate?
- Does logout invalidate the server-side session?
- Is only the hash of the session token stored?
- If cross-site, are CORS credentials and CSRF handled?

JWT / OAuth:

- Are signature, algorithm, `iss`, `aud`, and `exp` checked?
- Are access tokens short-lived?
- Are refresh tokens revocable and rotated?
- Does OAuth use current security guidance such as Authorization Code + PKCE?
- Are redirect URIs strictly matched?

Authorization:

- Does every sensitive endpoint enforce backend permission checks?
- Is authorization resource-level, not only role-level?
- Do multi-tenant queries include tenant scope by default?
- Does the backend reject access even if the frontend hides the button?
- Is permission logic tested?

Audit:

- Are login, permission changes, and high-risk actions recorded?
- Do logs include `requestId`?
- Are tokens, passwords, and secrets excluded from logs?
- Are 401 / 403 spikes monitored?

## The Final Rule

Authentication proves who you are. Session management decides whether this request still represents you. Authorization decides whether you can do this action on this resource.

The frontend can make the experience feel natural, but the final door must be on the backend. The database stores roles and relationships. The service layer enforces policy. Logs explain important actions later.

A good access-control system does not simply keep users out. It lets each user enter only the rooms they should, and it knows when a door opened, who opened it, and why.

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [MDN Secure cookie configuration](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies)
- [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700)
