# Multi-Skill Email Analysis Agent

An AI agent that reviews professional emails against two independent domains of expertise — etiquette and communication style — and returns a single, type-safe, structured verdict Claude assembles on its own.

Built on the **Claude Agent SDK**, this project shows how to package domain expertise as reusable, composable **Skills** that an agent discovers and applies autonomously, rather than hard-coding a single monolithic prompt.

## The Problem

Teams reviewing outbound email rarely apply consistent standards. One reviewer flags tone, another flags structure, and "communication style" (assertive vs. passive-aggressive, for example) is almost never assessed at all. This agent encodes both review disciplines as expert Skills and runs them together, every time, with a predictable JSON contract downstream systems can rely on.

## How It Works

```
┌─────────────────┐
│   Input Email    │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────┐
│   Claude Agent (SDK query)   │
│                               │
│  Discovers & applies:        │
│   • email-etiquette skill     │──▶ tone, structure, clarity, grammar
│   • communication-style skill │──▶ assertive / passive / aggressive / passive-aggressive
└────────┬─────────────────────┘
         │  Zod-validated JSON schema
         ▼
┌─────────────────────────────┐
│  Structured EmailReviewResult │
│  • overallTone                │
│  • communicationStyle         │
│  • score (0-100)               │
│  • issues[] (category/severity)│
│  • strengths[]                 │
│  • revisedEmail (if score < 80)│
└─────────────────────────────┘
```

Claude is never told *how* to apply either discipline in the calling code — each Skill's `SKILL.md` carries its own criteria, examples, and output contract in `.claude/skills/`. Claude reads each skill's `description` frontmatter and decides for itself which skills are relevant to the task, then applies both.

## Key Features

- **Autonomous skill discovery** — no manual routing logic; Claude selects and applies the relevant skills based on their descriptions.
- **Two independent expert skills** — [`email-etiquette`](.claude/skills/email-etiquette/SKILL.md) (tone, structure, clarity, professionalism) and [`communication-style`](.claude/skills/communication-style/SKILL.md) (assertive/passive/aggressive/passive-aggressive detection).
- **Schema-enforced structured output** — a Zod schema is converted to JSON Schema and enforced via the SDK's `outputFormat`, then re-validated with Zod on the way out, so the caller always gets a typed, trustworthy result.
- **Automatic revision suggestions** — emails scoring below 80 get a rewritten version proposed inline.
- **Framework-ready core** — the SDK call lives in a single exported function with a typed return, so it drops into a larger app, an API service, or a test suite without modification.

## Tech Stack

| Layer | Choice |
|---|---|
| Agent runtime | [`@anthropic-ai/claude-agent-sdk`](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) |
| Model | Claude (configurable via `ANTHROPIC_MODEL`) |
| Schema validation | Zod + `zod-to-json-schema` |
| Language | TypeScript (ESM), run via `tsx` |
| Domain expertise | Claude Skills (`.claude/skills/*/SKILL.md`) |

## Project Structure

```
.
├── .claude/
│   └── skills/
│       ├── email-etiquette/
│       │   └── SKILL.md        # Tone, structure, clarity, professionalism
│       └── communication-style/
│           └── SKILL.md        # Assertive/passive/aggressive/passive-aggressive detection
├── src/
│   ├── email-reviewer.ts       # reviewEmail() — the reusable, exported core
│   ├── sample-emails.ts        # Labeled fixtures for demos and tests
│   └── index.ts                # CLI entry point that exercises reviewEmail()
├── .env.example
├── package.json
└── README.md
```

## Getting Started

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment**
```bash
cp .env.example .env
```
Set `ANTHROPIC_MODEL` in `.env`. If your environment doesn't already provide credentials, also set `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL`.

**3. Run**
```bash
npm start
```

**Troubleshooting**
- `Error: ANTHROPIC_MODEL is not set` — make sure `.env` exists (`cp .env.example .env`).
- `Error: API key not found` — set `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` in `.env`.

## Sample Output

Given a casual, under-specified email like:

> `hey boss, need you to sign off on that thing asap thx`

the agent returns a structured result identifying it as `too-casual`, flags issues such as the missing greeting and vague request ("that thing"), scores it around 2/10, and proposes a revised version with a clear subject, greeting, and specific ask — all in one JSON payload, with no manual parsing of freeform text.

## Design Highlights

- **Composable expertise over prompt sprawl.** Each Skill is self-contained (criteria, examples, output contract), so adding a third review dimension means adding a `SKILL.md`, not rewriting a prompt.
- **Type safety end-to-end.** The same Zod schema drives both the JSON Schema sent to the model and the runtime validation of what comes back, closing the gap between "the model said it would return X" and "the caller can trust X."
- **Decoupled for reuse.** `reviewEmail()` in [`src/email-reviewer.ts`](src/email-reviewer.ts) has no CLI or I/O dependencies baked in:
  - **Embed it** in a larger application by importing the function directly.
  - **Deploy it as a service** by wrapping it in an HTTP handler (Express route, serverless function, etc.) — the same skill-discovery and structured-output behavior carries over unchanged.
  - **Unit test it** against the labeled fixtures in [`src/sample-emails.ts`](src/sample-emails.ts) (each with an `expectedTone`) from a runner like Vitest or Jest, asserting on `overallTone`, `communicationStyle`, and `score` without needing the CLI harness.
