# Vehicle Quick Lookup

A single-page web app that lets you look up vehicle data by VIN or license plate number. Built as a take-home assessment for CarsXE.

## What it does

Enter a 17-character VIN or a license plate (1–8 alphanumeric characters). The app auto-detects which format you've entered and shows a live badge. For plate lookups, a US state dropdown appears. On submit, a Next.js API route proxies the request to the CarsXE API server-side, strips the response down to a curated field set, and returns clean data to the browser. Recent lookups are cached in localStorage and displayed as pills below the input — clicking one rehydrates the result instantly with no new API call.

## Running locally

```bash
git clone https://github.com/ahyanbari/carsxe-vehicle-lookup-Assessment.git
cd carsxe-vehicle-lookup-Assessment
npm install
cp .env.example .env.local
# Add your CarsXE API key to .env.local:
# CARSXE_API_KEY=your_key_here
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** `USE_MOCK` in `lib/carsxe.ts` is set to `true` by default — I used mocked responses (real sample JSON from the CarsXE docs) throughout development to protect the 100-call sandbox quota, and made two verified end-to-end calls against the live API to confirm the proxy works. Flip `USE_MOCK` to `false` to call CarsXE for real.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | API routes and React in one project — no separate Express server needed |
| Language | TypeScript (strict) | Catches shape mismatches between CarsXE's response and our curated types at compile time |
| Styling | Tailwind CSS | Utility classes keep the component file self-contained; no separate CSS files to maintain |
| Cache | localStorage (browser) | Lightweight, zero dependencies, sufficient for a 5-entry recent-lookups list |
| Rate limiting | In-memory Map | Simple and correct for a single-instance dev server; production would use Redis or Upstash |

## Architecture

```
app/
  page.tsx           — Single-page UI: form, auto-detection, state dropdown, result cards, cache pills
  layout.tsx         — Root HTML shell: dark mode class, Geist Mono font, metadata
  globals.css        — Tailwind base + CSS keyframes (shimmer, slide-up-fade)
  api/lookup/
    route.ts         — POST /api/lookup: rate limit → validate → call CarsXE → return curated fields

lib/
  types.ts           — VinResult and PlateResult interfaces (curated output shapes only)
  validation.ts      — validateVin / validatePlate — returns null on pass, error string on fail
  carsxe.ts          — CarsXE API client: USE_MOCK flag, real fetch paths, CarsXeError class, mappers
  rateLimit.ts       — Sliding window rate limiter: 20 req/min per IP, in-memory Map
  cache.ts           — localStorage read/write, 1-hour TTL, 5-entry cap, dedup by cache key
```

## Security model

**The API key never reaches the browser.** CarsXE's documentation states the API must be called server-side to avoid CORS errors and key exposure. This app enforces that at the architecture level:

- `CARSXE_API_KEY` is read from `.env.local` via `process.env` — a server-only environment variable in Next.js
- All CarsXE `fetch()` calls happen inside `lib/carsxe.ts`, which is only ever imported by `app/api/lookup/route.ts` — a server-side API route
- The route strips the raw CarsXE response (150+ fields) down to the curated fields before sending anything to the browser
- Input is validated server-side in the route before any CarsXE call is made
- Rate limiting (20 req/min per IP) prevents abuse of the proxy

**To verify:** Open Chrome DevTools → Network → submit a lookup → inspect the `/api/lookup` request. The Payload shows only `{"type":"vin","value":"..."}`. The Response shows only curated vehicle fields. No key appears anywhere in browser traffic.

## Reflection

What was hardest
The hardest part wasn't building the features. It was committing to a stack I had never used. I came in with Python and vanilla JavaScript. React, Next.js, and TypeScript were all new to me. The brief preferred Next.js with TypeScript so I had a choice. Either hedge by building in something I already knew, or commit fully and use AI to learn it in real time. I committed.
What that actually looked like was pausing to understand why each file existed instead of just letting Claude Code generate everything. When something didn't click I would ask for a Python analogy because that's what I know. When Claude Code over engineered something I pushed back. The auto detection logic was a good example. The first version treated "HELLO" as a plate. I had to actually think about whether that was wrong. It's not really wrong because vanity plates can be short alphanumeric strings. Knowing when not to fix something ended up mattering as much as knowing what to fix.
One thing worth mentioning is that Claude Code didn't add .claude/, .env, or claude-log.md to the gitignore at first. I caught it because I got burned before on my own project. I had .env in gitignore but not ./env and my API keys got exposed on GitHub. I had to rotate them. That experience made me check every variant this time around.

What I'd do differently with more time
I would write actual tests on validation.ts and rateLimit.ts. Right now they work because I tested them by hand. Unit tests would catch regressions if I ever refactored. The brief listed tests as nice to have so I skipped them given the time budget but they should exist before any real deployment.
I would swap the in memory rate limiter for Redis or Upstash. The current setup works on a single instance but breaks if you scale horizontally because each server instance would have its own Map. I left a code comment about it.
I would also add small icons next to each field in the result card. Right now it's text labels in a grid which works but is heavy on text. Doing a door icon for Doors, a fuel pump for Fuel, a globe for Made In would let users scan the card faster.
I would also expand the lookup to pull recalls and market value when someone submits a VIN. Both endpoints already exist in the CarsXE API and it would make this useful instead of just a demo.

What I learned from building this with Claude Code
The biggest lesson was about how specific your prompts need to be. A vague prompt got me over engineered output with extra folders I didn't need. A precise prompt with constraints like "no services folders, keep files flat, no premature abstraction" got me clean code. When I told Claude Code to "build like a senior engineer" it started using design patterns the project didn't need. When I told it to "remove anything that doesn't earn its place" the code got tighter.

The second lesson was about verifying everything. Claude Code is fast which means it can hand you something that looks right in seconds. I caught three things it missed. First, the silent failure on invalid VINs where the button just disabled without showing the error message. Second, the result card was snapping into place instead of animating. Third, at one point it suggested logging the full API key URL during a preflight check. I redirected that to log only the length of the key, never the actual value. If I had just trusted the output I would have missed all of those.

The third lesson came from learning the network tab. Throttling requests, watching loading states, inspecting headers and payloads was all new to me. It actually changed how I think about my own work. The rate limiting concept especially. I have a filmmaking portfolio site and I need to limit how many times someone can submit my contact form from the same IP so people can't burn through my email quota. I'm bringing that back into V2 of that site.
AI works as a force multiplier on what you already understand. The instincts came from prior building. The speed came from the AI.

This project was built with Claude Code (Sonnet 4.6) under my direction. See `claude-log.md` for the build journal and the conversation export submitted alongside this repo for the full reasoning trail.
