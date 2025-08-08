Falak cultural fest web app scaffold.

## Getting Started

First, run the development server:

```
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

Routes created:
- `/` home
- `/passes`
- `/cultural_events`, `/cultural_events/[category]`, `/cultural_events/[category]/[slug]`
- `/sports_events`, `/sports_events/[category]`, `/sports_events/[category]/[slug]`
- `/tickets` (server action submit)
- `/profile` (protected)
- `/admin_manage` (protected)

Mock data is under `src/lib/mock_data/*`.

Optional envs: copy `.env.local.example` to `.env.local` and fill `NEXTAUTH_*` and `SUPABASE_*` keys. Tickets submission mocks success unless Supabase is configured.

## Notes
- Auth is scaffolded using Credentials for local demo; add OAuth providers and secrets later.
- Supabase helpers included; production insert uses service role if present.
