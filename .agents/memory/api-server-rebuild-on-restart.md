---
name: api-server esbuild rebuild required after lib changes
description: Why api-server keeps serving stale Zod/openapi validation behavior after editing a lib/* package, until the workflow is restarted.
---

`artifacts/api-server`'s `dev` script is `build.mjs` (esbuild) followed by `start` (`node dist/index.mjs`) — it bundles from `lib/*` TS sources at build time, not from `lib/*/dist`. Editing a generated file (e.g. `lib/api-zod/src/generated/api.ts` after a codegen run) has no effect on the running server until the `api-server` workflow is restarted, because nothing triggers an esbuild rebuild on save.

**Why:** confusing symptom — a route's Zod schema change (e.g. making a field optional) can look "not applied" via `curl` even though `pnpm run typecheck` and a source-code review both confirm the edit is correct. The stale `lib/api-zod/dist/` folder existing on disk (from an old build) adds to the confusion but isn't actually what's served — the esbuild bundle inside `artifacts/api-server/dist/index.mjs` is.

**How to apply:** after editing any `lib/*` package that `api-server` depends on (schemas, entitlements helpers, db schema, etc.), restart the `artifacts/api-server: API Server` workflow before re-testing with `curl`/e2e tests. Don't waste time re-diffing the source when the real fix is a restart.
