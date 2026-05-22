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
