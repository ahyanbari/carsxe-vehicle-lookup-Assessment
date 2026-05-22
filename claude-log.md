# Claude Build Log — Vehicle Quick Lookup

## [Step 1] — Scaffold Next.js 14 + TypeScript + Tailwind

- **What I did:** Ran `create-next-app@14` with `--typescript --tailwind --app --no-src-dir --eslint` flags. Moved output into the project directory (the `.claude` folder Claude Code uses caused a directory-conflict error, so I scaffolded into a sibling temp dir and moved files across).
- **Why:** App Router (`--app`) is the current Next.js convention — it replaces the older `pages/` directory. TypeScript strict mode is already on in the generated `tsconfig.json`. Tailwind gives us utility classes without a separate CSS file per component.
- **Tricky:** `create-next-app` refuses to scaffold into a non-empty directory. Workaround: scaffold into `carsxe-temp/`, copy everything except `.git/` into the real project dir, delete temp. No data lost.
- **Decisions made:**
  - Dropped Geist Sans from `layout.tsx` — only kept Geist Mono as the `--font-geist-mono` CSS variable. Monospace is our design accent; sans-serif body text will use Tailwind's default stack.
  - Set accent color as CSS variable `--accent: #22d3ee` (cyan-400) — one distinctive color, used sparingly per the brief.
  - `<html className="dark">` hardcoded — this is a dark-only app, no light/dark toggle needed.
- **Folder structure established:** `lib/` and `app/api/lookup/` created with placeholder exports. All real logic goes in Step 2.

## [Step 2] — POST /api/lookup with mock CarsXE responses

- **What I built:**
  - `lib/types.ts` — `VinResult` and `PlateResult` interfaces covering only the curated fields we display. `manufacturer_suggested_retail_price` shortened to `msrp` in our clean output type.
  - `lib/validation.ts` — `validateVin` and `validatePlate` using regex against the normalized (uppercased, trimmed) input. VIN regex excludes I/O/Q per ISO 3779. Returns `null` on pass, error string on fail.
  - `lib/rateLimit.ts` — in-memory `Map<ip, {count, resetAt}>` sliding window: 20 req/min per IP. Comment flags that production would use Redis/Upstash.
  - `lib/carsxe.ts` — `CarsXeError` custom exception class with a `code` discriminant (`not_found | rate_limited | server_error | timeout`). `lookupVin` and `lookupPlate` exported functions. `USE_MOCK = true` flag at top — flip to `false` in Step 3.
  - `app/api/lookup/route.ts` — `POST /api/lookup` handler. Reads IP → rate limit check → parse body → validate input → call carsxe.ts → map errors to user-friendly messages and correct HTTP status codes.
- **Mock pattern:** `USE_MOCK = true` at top of `carsxe.ts` short-circuits both lookup functions to return static `MOCK_VIN` / `MOCK_PLATE` constants built from the sample responses. The real fetch paths (with AbortController, timeout, status code handling) are already written and sit below — flipping the flag is the only Step 3 change.
- **Success-false-on-200 quirk:** CarsXE can return HTTP 200 with `{ success: false, error: "invalid_vin" }`. Handled explicitly after `res.json()` — if `!json.success`, we check the `error` field against a `NOT_FOUND_CODES` set and throw the appropriate `CarsXeError`.
- **Error mapping:** `CarsXeError.code` → HTTP status: `not_found` → 404, `rate_limited` → 429, `server_error` → 502, `timeout` → 504. User-facing messages never expose raw CarsXE error strings.
- **Verification (all passed):**
  - VIN `WBAFR7C57CC811956` → HTTP 200, full curated BMW 5-Series fields returned.
  - Plate `7XER187 CA` → HTTP 200, full curated Kia Forte fields returned.
  - Bad VIN `BADVIN` → HTTP 400, message: "VIN must be 17 characters and cannot contain I, O, or Q."
