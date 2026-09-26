# PRD — "For Sakshi" · Cinematic Birthday Gift Website

## Original Problem Statement
A scroll-driven, cinematic, desktop-only 3D birthday gift website for Sakshi, transferred from a
previous account as `sakshi-site.tar.gz`, needing extraction, review, refactoring, and a clean run.
Six chapters: a sunflower grows as the user scrolls through photos, poems, an underwater jellyfish
scene, video reels, and a birthday finale — all gated behind the password "Sakshi" (case-insensitive).

## Architecture
- **Frontend:** React 19 (CRA via craco) + Tailwind CSS + Framer Motion + GSAP + Lenis (smooth scroll)
- **3D:** React Three Fiber + three (butterfly GLB via GLTFLoader/SkeletonUtils, jellyfish alpha sprites, instanced petal shower)
- **Audio:** Howler.js — per-chapter ambient tracks, silent fallback for missing mp3s
- **State:** lightweight custom `useScrollStore` (no external state lib); Lenis streams scroll progress
- **Backend:** FastAPI exists but is UNUSED — fully static site, no DB, no API calls
- **Assets (public/):** 13 photos, 9 reels (mp4), 8 audio mp3s, 80 sunflower PNG frames (000–079) + manifest, textures (jelly sprites, soil), models (butterfly.glb, sunflower.glb)

## Password Gate
- Password **Sakshi**, case-insensitive. `gate-input` + `gate-submit`; ribbon-split reveal on success.

## Chapters
00 Plant (intro + seed) · 01 Grow (photo book) · 02 Drift (butterflies) · 03 Dream (jellyfish/poems) ·
04 Reel (video wall + modal) · 05 Bloom (finale marquee + petal shower)

## User Persona
The gift recipient (Sakshi) and the gifter — a single private, desktop viewer. Non-technical audience.

## Work Done
- **2026-06 (extract & run):** Downloaded and extracted the re-uploaded `sakshi-site.tar.gz`; synced
  `frontend/src`, `frontend/public`, and configs into `/app/frontend` while preserving the correct
  `REACT_APP_BACKEND_URL` in `.env` (removed the previous account's `birthday-bloom-19` URL risk).
- Installed added deps: `@react-three/fiber`, `three`, `gsap`, `howler`, `lenis` (yarn). No Drei needed.
- Audited for account-transfer risks: no hardcoded old-account URLs in `src`; GLB/texture paths are
  root-relative; sunflower frame count (80) matches files + manifest; all content arrays populated
  (PHOTO_TILES, POEMS, REELS, FINALE_PHRASES, CHAPTERS).
- Verified compile (HTTP 200), gate + unlock + plant-seed + Ch.01 photo book visually.
- Testing agent: 100% frontend pass, 0 issues — all 6 chapters render, all interactions work
  (photo-book drag-flip, reel modal open/close, marquee drag, audio toggle), no console errors.

## Backlog / Remaining (content decisions, not code)
- P2: Replace placeholder photos/reels/audio mp3s with final real media (drop-in, same filenames).
- P2: Finalize any pending poem/finale text.
- P2 (deploy): Static-host the `frontend/build/` output (Vercel/Netlify/any static host).

## Next Tasks
- None blocking. Site is running and verified. Awaiting user's real media / content, or deploy.
