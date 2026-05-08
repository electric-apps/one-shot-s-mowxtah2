# Vendored skills

These skills were vendored from upstream Electric SQL packages on
2026-05-03. They contain library-author-maintained instructions for
agents (Claude, Copilot, Cursor, etc.) on how to use the corresponding
libraries correctly.

| Skill | Source package | Source path |
|-------|---------------|-------------|
| electric-debugging | @electric-sql/client | electric/packages/typescript-client/skills/electric-debugging |
| electric-deployment | @electric-sql/client | electric/packages/typescript-client/skills/electric-deployment |
| electric-new-feature | @electric-sql/client | electric/packages/typescript-client/skills/electric-new-feature |
| electric-orm | @electric-sql/client | electric/packages/typescript-client/skills/electric-orm |
| electric-postgres-security | @electric-sql/client | electric/packages/typescript-client/skills/electric-postgres-security |
| electric-proxy-auth | @electric-sql/client | electric/packages/typescript-client/skills/electric-proxy-auth |
| electric-schema-shapes | @electric-sql/client | electric/packages/typescript-client/skills/electric-schema-shapes |
| electric-shapes | @electric-sql/client | electric/packages/typescript-client/skills/electric-shapes |
| electric-yjs | @electric-sql/y-electric | electric/packages/y-electric/skills/electric-yjs |

## Auto-installed via `intent install` postinstall

These skills come from packages that ship `skills/` in their published
npm tarballs. They land in `.claude/skills/` automatically on every
`pnpm install`.

| Skill | Source package |
|-------|----------------|
| tanstack-ai | @durable-streams/tanstack-ai-transport |
| vercel-ai-sdk | @durable-streams/aisdk-transport |
| yjs-editors | @durable-streams/y-durable-streams |
| yjs-getting-started | @durable-streams/y-durable-streams |
| yjs-server | @durable-streams/y-durable-streams |
| yjs-sync | @durable-streams/y-durable-streams |

## Skills NOT auto-installed (no upstream skills exist yet)

- `@durable-streams/client` — no `skills/` directory in source
- `@tanstack/db` — no `skills/` in source
- `drizzle-orm` — no `skills/` in source
