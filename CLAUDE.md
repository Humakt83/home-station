# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quality Workflow

Always follow this sequence after making changes:

```bash
npm run lint        # Check formatting and linting
npm run format      # Auto-fix formatting issues
npm run test        # Run unit tests + E2E tests
```

Run a single unit test file:

```bash
npm run test:unit -- --run src/lib/path/to/file.test.ts
```

Type-check the frontend:

```bash
npm run check
```

Type-check the server:

```bash
cd server && npm run type-check
```

## Architecture

This is a home dashboard with two processes that must run together in development:

- **Frontend**: SvelteKit (port 5173) — `npm run dev` in root
- **Backend**: Express (port 3000) — `npm run dev` in `server/`

Vite proxies all `/station/api` requests from the frontend to the Express server at `localhost:3000`. The Express server handles external API calls (e.g., electricity prices from `porssisahko.net`) to avoid CORS issues.

### Widget pattern

Each dashboard feature lives in `src/lib/<feature>/` and typically contains:

- `<Feature>.svelte` — the UI component
- `<feature>Service.ts` — data fetching (calls `/station/api/<feature>`)

The main dashboard (`src/routes/+page.svelte`) imports and lays out widgets using CSS Grid with named template areas.

### Adding a new API endpoint

1. Add a route in `server/src/index.ts` under the `/station/api` prefix
2. Create a service in `src/lib/<feature>/<feature>Service.ts` that fetches from `/station/api/<feature>`
3. Create a Svelte component and add it to the dashboard layout

## Key Tech

- **Svelte 5** (runes-based reactivity)
- **Tailwind CSS 4** (vite plugin, no config file needed)
- **svelte-chartjs** for charts
- **date-fns** for date formatting
- **Playwright** for E2E tests (configured to build + preview the app before running)
- Static adapter — the frontend builds to a static site
