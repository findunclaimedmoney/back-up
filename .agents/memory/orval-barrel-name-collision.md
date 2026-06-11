---
name: Orval barrel name collision for request-body schemas
description: Why request-body component schemas must not be named {OperationId}Body in this repo
---

In the contract-first OpenAPI setup (`lib/api-spec` → orval → `lib/api-zod`), the barrel
`lib/api-zod/src/index.ts` does `export * from "./generated/api"` (zod consts) AND
`export * from "./generated/types"` (TS types). A request-body component schema produces
BOTH a zod const (named after the operation, `{operationId}Body`) and a TS type (named after
the component). If those two names are identical, the barrel re-export collides:
`TS2308: Module ... has already exported a member named 'X'` and codegen fails.

**Why:** orval names the zod schema for a request body `{OperationId}Body`. If you also name
the component schema `{OperationId}Body`, the type and the const share a name. Response
schemas don't hit this because the zod name is `{OperationId}Response`, distinct from the
component type name.

**How to apply:** Name request-body component schemas with an `Input` suffix (the convention
the AI-integration skill uses, e.g. `OpenaiMessageInput`), never `{OperationId}Body`. The
generated zod const will still be `{OperationId}Body` and the type `{Name}Input` — no clash.
Import the zod const (e.g. `MiaChatBody`) from `@workspace/api-zod` to validate in the route.
