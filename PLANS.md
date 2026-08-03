# PLANS.md — Implementation Roadmap & Verification Tracking

This is the living document. Update it constantly as work happens — unlike
AGENTS.md, this file is expected to change every day of the build. Standing
rules and stack decisions belong in AGENTS.md, not here.

**Current stage:** Phase 1 data pipeline in progress.
**Last updated:** 2026-08-03

---

## How to Use This File

- Check a box only when the item is actually done and verified, not when
  it's started.
- The "Verification" column is not optional — "wrote the code" and "verified
  the code" are different states. For anything touching auth, money, or
  consent logic, verification means a passing test, not a manual glance.
- If a phase reveals that an earlier decision in AGENTS.md needs to change,
  stop and update AGENTS.md explicitly — don't let this file quietly drift
  out of sync with it.

---

## Phase 0 — Setup

- [x] Repo scaffolded (frontend + backend folders, this structure in place)
- [ ] Supabase project created (note project ref here once created: ___)
- [ ] Prisma initialized, connected to Supabase Postgres
      - Schema file has been drafted for users, multi-account ingestion,
        transactions, savings goals, credit scores, lender staff, and
        consent grants.
      - Connection validation is blocked until a real local `.env` exists
        with `DATABASE_URL`; do not validate against a guessed URL.
- [ ] Vercel project linked (frontend)
- [ ] Cloud Run service created (backend) — confirm billing card linked,
      confirm free-tier quota understanding (see AGENTS.md §2)
- [ ] `.env` created locally, confirmed **not** committed (check `.gitignore`)
      - `.gitignore` now excludes `.env` and `.env.*` while keeping
        `.env.example` tracked.
      - `.env.example` has been sanitized and must contain placeholders only.
- [ ] Supabase Auth wired end-to-end: sign up → session → protected route
      returns 401 without a valid session

**Verification for Phase 0:** a signed-up test user can log in and hit one
authenticated backend route that returns their own `user_id` back to them.

---

## Phase 1 — Core Data Pipeline

- [ ] `accounts` table created supporting many accounts per `user_id`
      (source: `plaid_bank` | `bank_csv` | `momo_csv`) — see AGENTS.md §3
- [ ] Plaid Sandbox account created, `client_id` + sandbox `secret` in `.env`
- [ ] `POST /api/v1/plaid/create-link-token` implemented
- [ ] `POST /api/v1/plaid/exchange-token` implemented — verify it stores the
      `access_token` against the **caller's own** new `account_id`, not a
      client-supplied one, and that it creates an additional account row
      rather than overwriting an existing linked account (this is the first
      live test of AGENTS.md §5 rule 1, and the first real test that
      multi-account linking actually works)
- [ ] `POST /api/v1/plaid/sync-transactions` implemented — confirm it syncs
      one specific `account_id`, and that the scheduled sync sweep iterates
      over every account a user has linked, not just the first one
- [ ] `POST /api/v1/csv/upload` implemented, accepting a `source` field
      (`bank_csv` or `momo_csv`) — verify malformed/irregular CSV rows don't
      crash the parser, for both bank and MoMo statement formats
      - Route code exists and creates a new CSV-backed account scoped to the
        authenticated session user, then imports valid rows into
        `transactions`. Full verification is blocked until a real database
        connection is available.
- [ ] Confirm a test user can have one Plaid-linked bank account **and** one
      MoMo CSV-based account simultaneously, both visible on the dashboard
- [ ] Rules-based categorization engine (`category_rules` table + matcher)
- [ ] Groq fallback wired for unmatched transactions
- [x] `@fastify/rate-limit` registered globally with a conservative default,
      before any route is exposed publicly — see AGENTS.md §9 for why this
      matters specifically for this project's free-tier stack

**Verification for Phase 1:** connect a Plaid sandbox account
(`user_transactions_dynamic`) **and** upload a synthetic MoMo statement CSV
for the same test user, confirm both sets of transactions land in the
`transactions` table tagged with the correct `account_id` and `source`,
confirm they get categorized without manual intervention, and confirm the
spending summary correctly aggregates across both accounts.

---

## Phase 2 — Spending Dashboard

- [ ] `GET /api/v1/transactions` implemented, session-scoped
      - Route code exists and scopes through `account.userId`; full
        verification is blocked until a real database connection is available.
- [ ] `GET /api/v1/spending/summary` implemented — aggregates across all of
      the authenticated user's linked accounts by default, with an optional
      `account_id` filter scoped to accounts that user actually owns (see
      AGENTS.md §3)
      - Route code exists, including the ownership check for `account_id`;
        full verification is blocked until a real database connection is
        available.
- [ ] Frontend design plan drafted per AGENTS.md §4 — color token palette,
      type pairing, layout concept, one signature element — reviewed
      against the three generic AI-look patterns before any dashboard
      component is coded
- [ ] Frontend dashboard: category breakdown chart, monthly summary, alerts
      feed, **and a visible per-account breakdown** (e.g. "Bank of Kigali"
      vs. "MTN MoMo") rather than one undifferentiated transaction feed
- [ ] `POST /api/v1/transactions/:id/categorize` implemented — verify it
      checks ownership before allowing an update

**Verification for Phase 2:** a test user with both a linked bank account
and a MoMo CSV account sees a combined spending summary by default, can
filter to just one account, and each transaction in the feed is visibly
labeled with which account it came from. Two different test users see only
their own transactions; attempting to categorize another user's
transaction ID returns a 403/404, not a success.

---

## Phase 3 — Savings Goals

- [ ] `POST /api/v1/goals`, `GET /api/v1/goals`, `PATCH /api/v1/goals/:id`,
      `DELETE /api/v1/goals/:id` implemented
- [ ] Feasibility calculation (monthly target vs. avg surplus) implemented
- [ ] Reminder scheduling (node-cron or Cloud Scheduler) wired

**Verification for Phase 3:** creating a goal with an unrealistic timeline
triggers the feasibility warning rather than silently accepting it.

---

## Phase 4 — Credit Scoring (MSME)

- [ ] Weighted scoring function implemented per the factor table in the
      build plan (cash flow consistency 30%, transaction volume 20%,
      repayment history 25%, business age/stability 15%, savings behavior 10%)
- [ ] Scoring function reads transactions across **all** of the business's
      linked accounts (bank + MoMo, or multiple of either), not just one —
      see AGENTS.md §3 on why scoring against a single account understates
      real cash flow for most MSMEs
- [ ] `POST /api/v1/credit-score/compute` implemented, `msme_owner`/`system`
      only
- [ ] `GET /api/v1/credit-score` implemented, returns factor breakdown
- [ ] **Vitest suite for the scoring function** — required per AGENTS.md
      §10, not optional; include a test case with transactions split across
      two accounts to confirm the function aggregates rather than only
      reading the first account found

**Verification for Phase 4:** scoring function has passing unit tests
covering at least one high-score and one low-score scenario with known
expected output, and one scenario where a business has both a bank and a
MoMo account, confirming both are reflected in the score; an `individual`
role calling the compute endpoint is rejected.

---

## Phase 5 — Insurance Matching

- [ ] Rules table mapping profile attributes to insurance products
- [ ] `GET /api/v1/insurance/recommendations` implemented
- [ ] Groq-generated plain-language explanations wired in

**Verification for Phase 5:** a farmer profile returns crop insurance, a
shop owner returns business insurance — matches the mapping in the build
plan, not arbitrary output.

---

## Phase 6 — LLM Integration Polish

- [ ] Groq prompt templates finalized for categorization
- [ ] Groq prompt templates finalized for insurance explanation copy
- [ ] Confirm rules engine handles the majority of transactions before LLM
      fallback triggers (spot-check the ratio — this matters for staying
      inside free-tier limits)

**Verification for Phase 6:** run a batch of 50+ realistic transactions,
confirm the LLM is only called for a minority of them.

---

## Phase 7 — Demo Readiness

- [ ] Seed one coherent demo user across all four features (consistent
      story — see build plan §12.3, don't use random data per screen)
- [ ] End-to-end walkthrough tested: signup → connect bank → dashboard →
      goal → score → insurance
- [ ] Live sandbox transaction injection tested as a demo trigger
- [ ] Confirm the sandbox transaction-injection route is only reachable
      when `PLAID_ENV=sandbox`, and is not compiled into or routed in any
      production build
- [ ] Deploy to Vercel + Cloud Run, confirm live URLs work end-to-end

**Verification for Phase 7:** a full walkthrough works on the deployed
(not local) environment, start to finish, without manual database edits.

---

## Phase 8 — Lender Portal (stretch goal / post-MVP)

- [ ] Lender auth implemented, confirmed **fully separate** from consumer
      Supabase auth (see AGENTS.md §7)
- [ ] `consent_grants` table + enforcement middleware
- [ ] `GET /api/v1/lender/scores/:businessId` implemented — verify it
      returns not-found (not an error revealing existence) when consent is
      missing
- [ ] `GET /api/v1/lender/scores/ranked-pool` implemented — verify it never
      falls back to returning all businesses if the opt-in filter fails
- [ ] `POST /api/v1/msme/loan-pool/opt-in` implemented, `msme_owner` only
- [ ] Consent grant expiry sweep job implemented

**Verification for Phase 8:** a lender account with no consent grant for a
business gets not-found; a lender with an expired grant also gets
not-found, not stale data.

---

## Open Questions / Decisions Pending

Track anything not yet settled here rather than letting it sit unresolved
in someone's head:

- [ ] _(example)_ Which Plaid sandbox institution will be used as the
      default demo bank — First Platypus Bank (`ins_109508`) is the
      current recommendation, confirm before building the demo script
- [ ] _(add items here as they come up)_

---

## Verification Log

Optional but recommended: a running log of what was actually tested and
when, especially for anything in AGENTS.md §5 (the two non-negotiable
rules). This is the difference between "I think this is secure" and "I
confirmed this is secure on [date]."

| Date | What was verified | Result |
|---|---|---|
| _(example)_ | Session-scoped query rejects client-supplied user_id | Pass |
| 2026-08-03 | Vitest suite for categorization rules, credit scoring, session scoping, and lender consent helper | Pass: 4 files, 7 tests |
| 2026-08-03 | TypeScript project check | Pass: `npx.cmd tsc --noEmit` |
| 2026-08-03 | Frontend production build | Pass: `npm.cmd run build`; Vite warns the initial Recharts bundle is over 500 kB |
| 2026-08-03 | Prisma schema validation | Blocked: no project `.env` file is present, and validation must use the real `DATABASE_URL` rather than a guessed URL |
| 2026-08-03 | Sanitized `.env.example` | Pass: credential values removed; placeholders only |
| 2026-08-03 | Added account, CSV upload, transaction list, and spending summary routes | Pass: `npx.cmd tsc --noEmit`; DB integration verification still blocked until real `DATABASE_URL` is available |
| 2026-08-03 | Regression test suite after route additions | Pass: `npx.cmd vitest run` |
| 2026-08-03 | Production build after route additions | Pass: `npm.cmd run build`; Vite warns the initial Recharts bundle is over 500 kB |
