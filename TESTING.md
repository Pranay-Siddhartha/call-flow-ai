# Testing

The repository has separate npm packages in `client/` and `server/`; there is no root `package.json` or root npm script. Run the commands below from the specified package directory. Tests use deterministic fixtures and mocked API/dependency responses. No automated test calls Gemini or accesses Supabase.

## Setup

Requirements: Node.js 22 or newer and npm.

From the repository root:

```powershell
cd client
npm ci
npx playwright install chromium

cd ..\server
npm ci
```

No `.env` file or production credential is needed for automated tests. The Playwright suite starts Vite and intercepts API requests.

On Windows, a local `npm ci` can fail with `EPERM` while replacing the native esbuild executable if the file is locked by another process or scanner. In that case, close local Vite/test processes and retry. In the review run here, the client `npm ci` retry still hit that Windows unlink error; `npm install` restored the client dependencies and all client tests, coverage, build, and Playwright tests then passed. The server `npm ci` completed successfully.

## Available scripts

From `client/`:

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `npm run dev` | Start Vite development server |
| `build` | `npm run build` | Create production frontend build |
| `preview` | `npm run preview` | Preview production build |
| `test` | `npm test` | Run client unit/component tests |
| `test:watch` | `npm run test:watch` | Run client tests in watch mode |
| `test:coverage` | `npm run test:coverage` | Run client tests and report coverage |
| `test:e2e` | `npm run test:e2e` | Run Playwright browser tests |

From `server/`:

| Script | Command | Purpose |
| --- | --- | --- |
| `start` | `npm start` | Start Express API |
| `dev` | `npm run dev` | Start API with Node watch mode |
| `test` | `npm test` | Run server HTTP/schema tests |
| `test:coverage` | `npm run test:coverage` | Run server tests with Node coverage |

## Test coverage

- Client unit/component tests cover stage data, API request/response handling, stage navigation and quote preservation, AI suggestion states, call start/end forms, history/details states, and hook persistence failures.
- Playwright tests cover a complete mocked eight-stage call, ending a call early, AI fallback, stage-save failure handling, history/details navigation, and a mobile-width overflow check.
- Server HTTP tests cover health, 404 and malformed JSON handling, call create/list/detail/close, stage validation/upsert/order, AI route contracts, safe errors, and concurrent call creation. Express dependencies are injected and replaced with in-memory fakes.
- Schema contract tests inspect `supabase/schema.sql` for tables, workflow constraints, keys, stage uniqueness, and RLS policy declarations. These static assertions are not PostgreSQL integration tests.

Vitest uses jsdom and React Testing Library. The server uses Node's built-in test runner and Supertest. Playwright starts a local Vite server on port 3000 and intercepts API requests at `http://localhost:3001/api/`. The tests do not write to a database or call the Gemini provider.

## Database/provider/manual validation

There is no disposable PostgreSQL/Supabase test instance configured in this repository. Validate PostgreSQL constraints, RLS behavior, cascade behavior, and queries only against a separate disposable database after applying `supabase/schema.sql`; do not target production. Route tests verify the Express contract using a fake Supabase client.

Gemini calls are mocked. Provider success, timeout, rate limits, and invalid-key behavior require an explicitly configured non-production environment and are not tested here.

Manual follow-up:

- Validate `supabase/schema.sql` against disposable PostgreSQL/Supabase, including RLS behavior with the actual service role.
- Check real Gemini failure modes using a non-production key.
- Check modal focus management and screen-reader announcements with assistive technology.
- Review color contrast and responsive behavior on physical devices; automated browser tests check horizontal overflow at one narrow viewport.

## Latest local results

| Suite | Passed | Failed | Skipped | Line coverage |
| --- | ---: | ---: | ---: | ---: |
| Client unit/component | 24 | 0 | 0 | 80.44% |
| Server HTTP/schema | 18 | 0 | 0 | 83.99% |
| Playwright browser | 4 | 0 | 0 | N/A |

The client coverage run reported 65.78% branch and 51.25% function coverage. The server run reported 75.13% branch and 93.59% function coverage. No coverage thresholds are configured; these are initial baselines. The client production build completed successfully.

## Continuous integration

`.github/workflows/test.yml` installs dependencies using `npm ci` and the committed package lockfiles, runs client and server tests and coverage, builds the client, installs Chromium with Playwright's system dependencies, then runs the mocked browser tests. It does not configure or require production Gemini or Supabase credentials.
