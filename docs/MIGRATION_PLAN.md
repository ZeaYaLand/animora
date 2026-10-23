# ANIMORA migration plan: ZenkaiTV foundation

## Goal
Move ANIMORA from a GitHub Pages-only single-page prototype to a maintainable anime catalog and playback application, using the MIT-licensed JSolanoDev/AnimeTV project as an implementation reference and selectively porting code with its required license notice.

Upstream: https://github.com/JSolanoDev/AnimeTV
Upstream license: MIT; preserve the original copyright and license in every distribution containing copied substantial portions.

## Safety rule
This branch is for migration work. Keep `main` and the current GitHub Pages deployment unchanged until the replacement builds and passes smoke tests. Do not commit API keys or service-role secrets. Do not host or copy copyrighted video files; only integrate lawful metadata and playback sources.

## Architecture target
- Frontend: upstream static app shell, CSS, client-side routing, catalog/detail/player/library modules.
- Backend: Node API adapter and server handler, with explicit timeouts, bounded retries, cache headers, request coalescing and stale fallback.
- Hosting: Vercel or another Node-compatible host; GitHub Pages alone cannot run the API.
- Identity: rebrand UI as ANIMORA and localize user-facing text into Russian without removing upstream attribution.
- Data: treat AniList/Jikan as metadata providers, not as guaranteed playback providers. Keep provider failures isolated and visible; no provider can guarantee a literally complete global catalog.

## Migration sequence
1. Preserve this branch as a safe staging branch.
2. Port the upstream source tree and MIT LICENSE, retaining attribution.
3. Inventory provider modules and identify optional dependencies, environment variables, and routes.
4. Apply ANIMORA branding and Russian UI localization; avoid blind global replacements in code or third-party notices.
5. Build with Node.js 20.9+ and npm; run upstream checks and tests.
6. Verify health, catalog, search, title details, episode lists, playback source selection, favorites, history, mobile layout, and API failure states.
7. Configure a separate Vercel preview deployment and only then switch the public link.

## Acceptance criteria
- A clean install and production build succeed.
- `/api/health` reports service status.
- Catalog/search/detail pages remain usable when one upstream metadata API is down.
- The app never reports a source as working unless the API actually returned usable data.
- Playback uses only configured lawful sources; unavailable sources show a clear message.
- Russian UI is consistent, and browser console has no fatal errors.
- Existing `main` deployment remains untouched until explicit verification.
