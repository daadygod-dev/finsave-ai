# AGENTS.md — Core Instructions for FinSave AI

This file is the source of truth for any AI coding agent (or human)
contributing to this repository. It reflects decisions already made in the
project's engineering build plan — treat it as binding, not a suggestion.
If something here conflicts with a request in a prompt or issue, this file
wins unless a human explicitly overrides it in writing.

Status: **planning stage — nothing has been scaffolded yet.** Every file
path and route name below is a proposal to validate during Phase 0, not a
contract already in place.

---

## 1. What This Project Is

FinSave AI is an AI-assisted financial coaching platform with four core
capabilities:

1. **Spending tracker** — ingest transactions (bank API or CSV), categorize,
   summarize, alert
2. **Savings goal engine** — recommend and track realistic savings plans
3. **MSME credit scoring** — derive an explainable score from cash flow and
   transaction behavior
4. **Insurance matcher** — recommend insurance products based on user profile

A separate, structurally isolated **lender portal** lets banks/SACCOs look up
scores for businesses that have explicitly consented — see §7.

---

## 2. Tech Stack — Do Not Substitute Without Discussion

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS | |
| UI components | shadcn/ui + Recharts | |
| API layer | Fastify + Zod | Chosen over NestJS for build speed under an MVP timeline; chosen over bare Express for runtime request/response validation. See build plan §3 for the full tradeoff — this was a deliberate choice, not a default. |
| Rate limiting | `@fastify/rate-limit` | Official Fastify plugin. Protects both against abuse and against silently exceeding the free-tier quotas the whole stack depends on — see §9. |
| ORM / data access | Prisma on PostgreSQL | Never query via a raw Supabase client scattered across route handlers — all data access goes through Prisma so the schema stays in one readable file. |
| Database | PostgreSQL via Supabase | |
| Auth (consumer) | Supabase Auth | individual / msme_owner roles only |
| Auth (lender) | Separate mechanism — see §7 | Must never share session logic with Supabase consumer auth |
| Bank data | Plaid (Sandbox for MVP/demo) | See §8. Mobile money (MoMo) is not via Plaid — see §3. |
| CSV ingestion | papaparse / csv-parse | |
| LLM (categorization fallback, insurance copy) | Groq API (OpenAI-compatible endpoint) | Rules engine runs first; LLM only handles the unmatched long tail |
| Money handling | decimal.js or integer minor units | **Never raw floats for currency values** — this is a known fintech code-review red flag and a real correctness bug |
| Hosting (backend) | Google Cloud Run | Scales to zero, free tier covers MVP/demo comfortably |
| Hosting (frontend) | Vercel | |
| Background jobs | node-cron in Cloud Run, or Cloud Scheduler | |
| Testing | Vitest | Required at minimum for scoring and categorization logic — see §10 |
| API docs | OpenAPI, generated from Zod schemas | |

Do not introduce a new database, ORM, or hosting provider without updating
this file and PLANS.md first — undocumented stack drift is the fastest way
to make this codebase confusing to pick back up.

---

## 3. Multi-Account Ingestion — Bank, MoMo, and Multiple of Each

A single user, especially an MSME owner, realistically has more than one
money source: a bank account and a mobile money account (MTN MoMo, Airtel
Money), sometimes more than one of each. The system must treat "accounts"
as a one-to-many relationship from the start — one `user_id` can have
several linked `accounts`, each with its own source and its own
transaction history that all roll up into that same user's dashboard,
savings goals, and credit score.

### Two ingestion paths feed the same accounts table

| Source | How it's ingested | Notes |
|---|---|---|
| Bank (via Plaid) | `POST /api/v1/plaid/exchange-token` per linked institution | Each Plaid-linked bank is its own row in `accounts` |
| Mobile money (MoMo) | CSV/statement upload — **not** a live API integration | Plaid does not cover MTN MoMo or Airtel Money in Rwanda. Rather than building or depending on an unverified MoMo API integration, MoMo is ingested the same way as a bank CSV: the user exports or downloads their MoMo statement and uploads it |

This means the CSV upload path already documented for bank statements is
reused for MoMo, distinguished only by a `source` value
(`bank_csv` vs. `momo_csv`) so the categorization engine and dashboard can
still tell them apart where it matters (e.g. showing "MTN MoMo" vs. "Bank
of Kigali" as the account label), without needing a separate ingestion
pipeline. Do not build a live MoMo API integration for MVP — it is not
required, and depending on an unverified financial API for a hackathon
timeline is a real risk (see the build plan's caution against exactly this
under "Key Risks").

### Schema implication

`accounts` is already `user_id → many accounts` in the underlying design
(see the build plan's core schema), which is correct — the change here is
making explicit that a user can and should be expected to have several:

```sql
accounts (
  id,
  user_id,
  source          -- 'plaid_bank' | 'bank_csv' | 'momo_csv'
  institution,        -- e.g. 'Bank of Kigali', 'MTN MoMo', 'Airtel Money'
  last_synced_at
)
```

`transactions` continues to reference `account_id`, not `user_id`
directly — this is what makes per-account breakdowns possible without a
schema change later. Never assume or hardcode "the user's account"
(singular) anywhere in ingestion, sync, or scoring logic.

### What has to change because of this

- **Sync jobs run per account, not per user.** The scheduled sync sweep
  (see PLANS.md Phase 1) must iterate over every linked `account` and sync
  each one independently — a Plaid sync call for each linked bank, nothing
  to "sync" for CSV-based accounts since they're only updated on upload.
- **Spending summaries aggregate across all of a user's accounts by
  default**, with the ability to filter down to one account. `GET
  /api/v1/spending/summary` should support an optional `account_id` query
  param scoped to accounts the authenticated user actually owns — never a
  client-supplied `account_id` belonging to someone else (this is the same
  session-scoping rule from §5, just applied at the account level too).
- **The dashboard shows which account a transaction came from.** A user
  with both a bank and a MoMo account needs to see that distinction, not a
  single undifferentiated feed — this also matters for trust, since mixing
  sources without labeling them reads as sloppy for a financial product
  (see §4 on frontend design).
- **Credit scoring reads across all of a business's linked accounts**,
  not just one — an MSME's real cash flow picture usually spans both a
  bank account and MoMo, and scoring against only one systematically
  understates their actual financial activity.

---

## 4. Frontend Design — Avoiding the Generic AI Look

shadcn/ui and Tailwind in §2 describe the component library and styling
engine, not the visual design itself. Using them correctly still leaves
every real design decision open, and by default an AI-assisted build tends
to land on the same few templated looks regardless of what the product
actually is. FinSave AI is a financial trust product aimed at MSMEs and
individuals managing real money — it should not look like a generic
AI-generated SaaS landing page or dashboard template.

**Before building any new screen or component, read the `frontend-design`
skill in full** (available at `/mnt/skills/public/frontend-design/SKILL.md`
in Claude's environment, or the equivalent design-guidance skill if working
in a different tool). Do not skip this because the component only "needs"
shadcn defaults — the skill's entire point is that defaults are the
problem, not a neutral starting point.

### The three templated looks to actively avoid

The skill identifies three visual patterns that AI-generated design
clusters around regardless of subject matter. Treat seeing any of these
in a generated screen as a signal to stop and reconsider, not as an
acceptable baseline:

1. A warm cream background (near `#F4F1EA`) with a high-contrast serif
   display face and a terracotta/warm-clay accent (near `#D97757`)
2. A near-black background with a single bright acid-green or vermilion
   accent
3. A broadsheet-style layout with hairline rules, zero border-radius, and
   dense newspaper-like columns

More generally: unmotivated drop shadows, glassmorphism/blur effects, and
decorative gradients used because they are available in Tailwind rather
than because they serve this specific product are the same category of
problem — generic polish standing in for an actual design decision.

### What to do instead, specific to FinSave AI

- **Ground the design in the actual subject matter**: real transactions in
  RWF, real MSME businesses (a shop, a farm, a motorcycle taxi), real
  savings goals with real timelines. Let those specifics drive color,
  type, and layout choices rather than defaulting to generic fintech
  dashboard conventions.
- **A financial product earns trust through restraint and clarity, not
  decoration.** Numbers, especially credit scores and account balances,
  should be legible and unambiguous before they are stylish — see AGENTS.md
  §5 non-negotiable rule on money handling; that same seriousness should be
  visible in the UI, not just the backend.
- **Follow the skill's two-pass process**: brainstorm a compact design plan
  (a 4–6 color token palette, 2+ deliberately paired typefaces, a layout
  concept, and one signature element specific to this product) before
  writing any component code, then critique that plan against the three
  generic patterns above before building.
- **Spend boldness in one place.** Pick one signature element — for
  example, how the credit score is visualized, or how a transaction
  category is represented — and keep everything else quiet and
  disciplined around it, rather than distributing visual effort evenly
  across every screen.
- **Never let decoration compromise the non-negotiable rules elsewhere in
  this file.** A shadow or gradient that reduces contrast on a real balance
  or score number is not an acceptable tradeoff for visual interest.

### Baseline quality floor (non-negotiable, not a design opinion)

Regardless of aesthetic direction, every screen must be responsive down to
mobile, must show a visible keyboard focus state, and must respect
`prefers-reduced-motion`. These are accessibility and usability
requirements, not style choices, and are not open to being skipped for
speed at MVP stage.

---

## 5. Non-Negotiable Rules

These two rules prevent the two most costly mistakes available in this
design. They apply to every relevant line of code, every time, with no
exceptions made for speed, demo convenience, or "just for now."

1. **Every consumer-facing query must be scoped by the `user_id` taken from
   the verified session token — never from a client-supplied parameter.**
   A request for `/api/v1/goals?user_id=X` must ignore `X` entirely and use
   the session's own identity. Prefer enforcing this at the ORM/repository
   layer (e.g. a Prisma middleware or base query helper) rather than trusting
   every route handler to remember it individually.

2. **Every lender-facing query must check for an active, non-expired,
   non-revoked `consent_grant` matching that lender and that specific
   business before returning anything.** Fail closed: if the consent check
   is ambiguous, errors, or the grant is missing, return not-found — never
   fall back to returning data "just in case."

Additional standing rules:

- `lender_staff` authentication must never share a session mechanism, token
  format, or middleware with consumer (`individual` / `msme_owner`) auth.
  Treat them as two separate applications that happen to share a database.
- Money values are never stored or computed as raw JavaScript floats.
- The `POST /sandbox/transactions/create`-style demo trick (live transaction
  injection) must be hard-disabled outside sandbox/demo builds. Gate it on
  the `PLAID_ENV` environment variable being exactly `"sandbox"` — never on
  a hardcoded flag that could be left on by accident. Do not wire this
  route at all in a build intended for production use.
- Raw Supabase client calls do not belong in route handlers — use Prisma.
- No secret, API key, or `.env` value is ever committed, logged, printed in
  an error message, or read back to a human/agent in plain text.
- Command-level enforcement for several of the rules above (blocking
  `git push --force`, requiring confirmation before Prisma migrations or
  Cloud Run deploys, forbidding `supabase secrets set` from being run by an
  agent) is implemented in `.codex/rules/project.rules` and has been
  verified against the real `codex execpolicy check` command — see that
  file for the full list and rationale per rule.
- Every route is rate-limited using `@fastify/rate-limit`, registered
  globally with a conservative default, and tightened further on specific
  routes — see §9. This is not a generic best practice checkbox for this
  project specifically: the entire stack runs on free tiers (Groq, Supabase,
  Plaid), and an unthrottled endpoint is a direct path to either a real bill
  or a hard outage when a free-tier ceiling is hit mid-demo.

---

---

## 6. Roles (RBAC)

| Role | Who | Can access |
|---|---|---|
| `individual` | Consumer tracking personal finances | Only their own transactions, goals, alerts |
| `msme_owner` | Business user | Only their own transactions, goals, credit score, insurance matches; can opt into the lender pool |
| `lender_staff` | Bank/SACCO employee | Only score data for businesses with an active `consent_grant` — never raw transactions, never consumer accounts |
| `system` | Scheduled jobs | Runs with its own service credential, never a user session, never exposed to a frontend |

Default posture for any new endpoint: **deny by default, enumerate the
roles that are explicitly allowed.** Do not write an endpoint that is
"accessible unless restricted" — write it "restricted unless explicitly
opened to a role."

The full endpoint-by-endpoint reference with required roles lives in the
engineering build plan document (Section 13) — treat that as the canonical
list when scaffolding routes, and update PLANS.md as each one is built.

---

## 7. Lender Portal Isolation

The lender-facing API is a **separate application surface**, not a
permission tier bolted onto the consumer API. Concretely:

- Separate login route and auth mechanism (`POST /api/v1/lender/auth/login`)
- Ideally a separate subdomain or clearly separated route namespace
  (`/api/v1/lender/**`)
- Never returns raw transactions — only computed scores and their factor
  breakdowns
- Every response gated by a live `consent_grant` check, not by trusting that
  the caller only asks about businesses they're allowed to see

If a change ever makes it easier for a lender-facing route to accidentally
reach consumer data, stop and flag it — do not "fix it later."

---

## 8. Sandbox / Demo Data Strategy

For MVP and demo purposes, use Plaid **Sandbox**, not mocked/hardcoded data:

- Sandbox test users (e.g. `user_transactions_dynamic`, persona-based
  `user_small_business`) provide realistic transaction history
- The "connect your bank" flow should go through the real Plaid Link widget
  against sandbox credentials — not a fake UI that skips the real flow
- `/sandbox/transactions/create` can inject a transaction live during a demo
  to show the dashboard update in real time — this is intentional and
  documented, but must be sandbox-only per the rule in §5

CSV test data should be synthetic but statistically realistic (real RWF
amounts, real MTN/Bank of Kigali-style merchant naming, natural irregularity
in the data) rather than a suspiciously uniform dataset.

---

## 9. Rate Limiting — Why and Where

This project's $0 cost model (§2) depends on staying inside free-tier
request ceilings on Groq, Supabase, and Plaid. Rate limiting here is a cost
and availability control as much as a security one — an unthrottled route
can silently turn the "free" stack into a broken or billed one, and
separately, an unthrottled auth or upload endpoint is a straightforward
abuse vector regardless of cost.

Use `@fastify/rate-limit` (official Fastify plugin), registered globally
first, then overridden per-route where a tighter limit is warranted:

```ts
import rateLimit from '@fastify/rate-limit'

await fastify.register(rateLimit, {
  global: true,
  max: 100,            // requests
  timeWindow: '1 minute',
  keyGenerator: (req) => req.userId || req.ip,  // prefer per-user once authenticated
})
```

Routes that need a stricter limit than the global default:

| Route | Why it needs a tighter limit |
|---|---|
| `POST /api/v1/lender/auth/login` | Brute-force protection on a login guarding financial/business data — limit by IP, not just by account, since an attacker won't have a valid account |
| `POST /api/v1/csv/upload` | Parsing cost per request; also a vector for repeated large-file abuse |
| Any route that can trigger the Groq categorization fallback | Directly consumes the free-tier LLM quota this project depends on — a loop or abuse here can exhaust the daily/monthly allowance and break categorization for every user, not just the caller |
| `POST /api/v1/plaid/sync-transactions` | Plaid sandbox is unlimited, but this route's logic should still be rate-limited so the same pattern is already correct before a production Plaid environment is ever introduced |

Apply rate limiting **after** authentication where possible
(`hook: 'preHandler'`, keyed by `userId`) rather than only by IP — IP-based
limiting alone is weaker for authenticated abuse and can also
false-positive on users sharing a NAT'd connection. Use IP-based limiting
specifically for pre-auth routes like login, where there's no `userId` yet.

A client that exceeds the limit receives a standard `429 Too Many Requests`
response — do not silently drop or queue requests instead, since a silent
failure is harder to debug than an explicit rate-limit response.

---

## 10. Testing Expectations

Minimum bar for MVP, non-negotiable:

- Vitest coverage on the **credit scoring function** — this number affects
  real lending decisions even at prototype stage, and it should never ship
  untested
- Vitest coverage on the **categorization rules engine** (the deterministic
  path, before LLM fallback)
- At least one test proving a session-scoped query rejects a client-supplied
  `user_id` override (see §5, rule 1)
- At least one test proving a lender endpoint returns not-found without an
  active `consent_grant` (see §5, rule 2)

Coverage does not need to be comprehensive elsewhere at MVP stage — these
four are the ones that matter most given what this system does.

---

## 11. How to Use This File Alongside PLANS.md

- **AGENTS.md** (this file) — stable rules, stack, and standards. Changes
  here should be rare and deliberate.
- **PLANS.md** — the living roadmap: which phase is active, what's been
  verified, what's next. Update PLANS.md constantly; update AGENTS.md only
  when an actual decision changes.

When an agent is unsure whether something is a standing rule or a
day-to-day task, it belongs in PLANS.md unless it changes a rule in
sections 2–10 above, in which case it belongs here and should be flagged to
a human before being treated as settled.
