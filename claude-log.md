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
## [Step 4a] — Auto-detection bug fixes (iteration after browser testing)

- **Bug 1 — Silent failure on invalid VIN:** Typing 17 chars that fail VIN_RE (e.g. `BADVIN12345678902` which contains `I`) caused the submit button to disable with no explanation. Fix: added `getInputError(raw)` which fires only at exactly 17 chars and returns the spec-mandated message "VIN must be 17 characters and cannot contain I, O, or Q." Inline error renders below the input; input border turns red.
- **Bug 2 — My own Check 1 instruction was wrong:** I told the user "HELLO → no badge" in the test script, but HELLO is 5 alphanumeric chars, which correctly matches PLATE per the spec (1–8 alphanumeric → plate). The detection logic was right; my test instruction was wrong. Edge cases confirmed correct: empty → nothing, 1–8 alphanumeric → PLATE, 9–16 chars → neutral, 17 valid → VIN, 17 invalid → inline error.
- **`canSubmit` updated:** Now also gates on `!inputError` so a 17-char invalid string can never be submitted.
- **Visual:** Input border conditionally switches to `border-red-500` when `inputError` is set. Badge suppressed while error is active.

## [Step 3] — Wire route to real CarsXE API (2-call budget)

- **Pre-flight Check 1:** Ran `node -e` to verify `CARSXE_API_KEY` is loaded from `.env.local` without starting the server. Result: `key present: true, length: 29`. Key confirmed readable by the Node process.
- **Pre-flight Check 2:** Added a temporary redacted `console.log` inside `lookupVin` — printed the full URL with `[REDACTED:29 chars]` in place of the key. Confirmed key length matches Check 1, VIN is uppercased, URL structure matches the CarsXE spec. Log line removed before committing — we never ship debug lines that reference secrets, even redacted ones.
- **Real API calls made (2 total):**
  - VIN `WBAFR7C57CC811956` → HTTP 200, real BMW 5-Series data returned. Fields matched mock except `type` and `fuel_type` were empty strings — real API behavior, not a bug.
  - Plate `7XER187 CA` → HTTP 200, real Kia Forte LX data returned. All fields populated.
- **Empty-field observation:** Real CarsXE responses can return empty strings for optional fields (e.g. `type`, `fuel_type`). Mock data had these populated. Frontend (Step 5) must handle empty strings gracefully — never render a blank label.
- **`USE_MOCK` restored to `true`** immediately after the 2 calls. Comment updated to explain it stays `true` for the entire build until final demo.
- **Security decision — redacted preflight logging:** When verifying the request URL is built correctly before flipping `USE_MOCK = false`, never log the full URL with the API key in it — not even as a temporary debug line. Use a redacted pattern instead:
  ```ts
  "[REDACTED:" + (process.env.CARSXE_API_KEY?.length ?? 0) + " chars]"
  ```
  This confirms the key is present and the correct length without ever printing the value. Logging secrets to the terminal, even locally and temporarily, normalizes a habit that causes credential leaks in production.
