# ChemTrack — Lab Inventory

Digital chemistry lab inventory: chemicals, equipment, expiry alerts, usage logs,
PWA support, and image uploads.

## Stack
- React 19 + TanStack Start (SSR) + TanStack Router
- TailwindCSS v4 + shadcn/ui
- Supabase (Postgres, Auth, Storage)
- Vite 7

## Local dev
```bash
bun install
bun run dev          # http://localhost:8080
```

## Environment variables
Copy `.env` and set:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...

# Server-only (Vercel project env)
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Deploy to Vercel

1. Push the repo to GitHub.
2. In Vercel → **Add New Project** → import the repo.
3. **Framework Preset**: `Other` (let `vercel.json` drive the build).
4. Add all env vars above in **Project Settings → Environment Variables**.
5. Deploy.

`vercel.json` rewrites every request to `api/index.mjs`, which runs the SSR
handler from `@tanstack/react-start/server-entry`. Static assets are served
directly from `dist/client`.

### Notes
- Server functions (`createServerFn`) and Supabase auth-protected routes run
  in the `api/index.mjs` serverless function.
- Build output: `dist/client` (static) + `dist/server` (SSR bundle).
- If the SSR function cold-start is slow, consider Vercel's
  **Edge Runtime** by changing `config.runtime` in `api/index.mjs` (note: some
  Node-only Supabase deps may be incompatible).

## Build
```bash
bun run build        # produces dist/client + dist/server
```
