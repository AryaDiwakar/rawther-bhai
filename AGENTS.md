<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:prisma-agent-rules -->
# This is NOT the Prisma you know

This project uses **Prisma 7** (not Prisma 5 or 6). Key breaking changes:

- **`prisma.config.ts` required** — datasource URL is defined here, NOT in `schema.prisma`
- **Driver adapters required** — `PrismaClient` needs an adapter, not `datasourceUrl`:
  ```ts
  import { PrismaPg } from "@prisma/adapter-pg"
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })
  ```
- **`prisma generate` requires `DATABASE_URL` in env** — run with `DATABASE_URL=... npx prisma generate`
- **`prisma migrate` uses `prisma.config.ts`** — `prisma migrate dev` works as before but reads config from `prisma.config.ts`

Environment variable for Prisma CLI:
```bash
DATABASE_URL="postgresql://..." npm run db:push
```
<!-- END:prisma-agent-rules -->
