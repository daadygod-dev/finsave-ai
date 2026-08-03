# FinSave AI

An AI-assisted financial coaching platform: spending tracking, savings goal
management, MSME credit scoring, and insurance matching — built as a
web-first MVP.

> **Status:** Early scaffold in progress. Backend and frontend foundations
> exist, but DB-backed flows still need verification against a real Supabase
> database. If you're picking this up, start with `PLANS.md` to see what's
> actually been built vs. still planned.

---

## What This Is

FinSave AI helps individuals and small businesses in Rwanda (and similar
markets) understand their spending, build savings discipline, and — for
MSMEs — get access to credit and insurance products they'd otherwise
struggle to qualify for due to a lack of formal financial history.

Four core features:

1. **Spending tracker** — connects one or more bank accounts (via Plaid)
   and mobile money accounts (MTN MoMo, Airtel Money, via statement
   upload), automatically categorizes transactions across all linked
   accounts, and surfaces spending summaries and alerts.
2. **Savings goals** — suggests realistic savings plans based on income and
   spending patterns, tracks progress, sends reminders.
3. **MSME credit scoring** — computes an explainable 0–100 credit score from
   cash flow, transaction behavior, and repayment history across all of a
   business's linked accounts.
4. **Insurance matching** — recommends relevant insurance products (crop,
   business, motorcycle, health) based on a user's profile, explained in
   plain language.

A separate **lender portal** lets banks and SACCOs look up credit scores for
businesses that have explicitly opted in and granted consent — see
`AGENTS.md` §7 for how that isolation is enforced.

---

## Repository Structure

```
your-project/
├── .codex/                # OpenAI Codex CLI project configuration
│   ├── config.toml         # Model, approval policy, sandbox settings
│   └── rules/
│       └── project.rules   # Command-level execution policy (Starlark)
├── AGENTS.md               # Binding rules, stack decisions, standards
├── PLANS.md                # Living roadmap — what's built, what's next
├── src/                    # Application source code
└── README.md               # This file
```

If you're a human joining this project, read in this order:
1. This README, for context
2. `AGENTS.md`, for the rules and stack that are already decided
3. `PLANS.md`, for what phase the project is actually in right now

If you're an AI coding agent, `AGENTS.md` is your primary instruction file —
read it before making any change, and treat its rules as binding.

---

## Tech Stack (Summary)

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| API | Fastify + Zod |
| ORM | Prisma |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (consumer), separate mechanism (lender) |
| Bank data | Plaid |
| Mobile money (MoMo) | Statement/CSV upload — not a live API integration |
| LLM | Groq API |
| Hosting | Vercel (frontend), Google Cloud Run (backend) |

Full rationale for every choice — including why NestJS and a few other
reasonable alternatives were considered and not used — lives in `AGENTS.md`
§2 and in the full engineering build plan document.

This stack is designed to run at **$0 cost** at MVP/demo scale, using the
free tiers of every service listed above.

Visual design is treated as a deliberate decision, not a byproduct of using
shadcn/ui defaults — see `AGENTS.md` §3 before building any new screen.

---

## Getting Started (once Phase 0 is complete)

```bash
# Clone and install
git clone <repo-url>
cd your-project
npm install

# Environment setup — copy the example and fill in real values.
# Never commit the real .env file.
cp .env.example .env

# Database
npx prisma migrate dev

# Run locally
npm run dev
```

Required environment variables — copy `.env.example` once it exists in
Phase 0, or use the list below as the starting point:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
GROQ_API_KEY=
```

Get Plaid sandbox credentials at `dashboard.plaid.com` → Developers → Keys.
No approval wait, no card required for sandbox use.

---

## Demo / Sandbox Data

This project deliberately uses **real Plaid Sandbox flows** rather than
hardcoded fake data, so the demo behaves like the actual production system
would. See `AGENTS.md` §6 for details, including the live
transaction-injection trick used to show the dashboard updating in real
time during a demo.

---

## Security Notes for Contributors

Two rules in this codebase are non-negotiable — see `AGENTS.md` §3 for the
full explanation:

1. Every consumer query is scoped by the authenticated session's `user_id`,
   never a client-supplied one.
2. Every lender-facing query requires an active, non-expired `consent_grant`
   before returning any business data.

If you're touching `src/auth/**`, `src/lender/**`, or the Prisma schema,
read `AGENTS.md` first. Codex's own guardrails are set in two places:
approval policy and sandbox mode in `.codex/config.toml`, and command-level
allow/prompt/forbid rules in `.codex/rules/project.rules` (for example,
`git push --force` and production Prisma migrations are blocked there).
Verify any change to the rules file with:

```bash
codex execpolicy check --pretty --rules .codex/rules/project.rules -- <command>
```

---

## Where to Go for More Detail

The full engineering build plan (architecture diagrams, phased delivery
schedule, database schema, API endpoint reference with role requirements,
and the demo/sandbox strategy) lives in the project's build plan document,
maintained alongside this repo. `PLANS.md` tracks execution against that
plan; this README stays intentionally short.
