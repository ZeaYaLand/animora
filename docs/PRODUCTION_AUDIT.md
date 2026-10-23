# ANIMORA production code audit

Date: 2026-10-24
Repository: https://github.com/ZeaYaLand/animora
Audited ref: main @ ab097340cb7850c1dbfa0d46054386039fd9b643

## Verified status
- The latest observed GitHub Pages workflow run (ID 40022041841) completed with conclusion `success`.
- The repository's root app is a single `index.html` file (about 56 KB of source in the current fetch); there is no package.json or Vercel API function in the root listing.
- The Vercel project homepage recorded by GitHub metadata is `https://animora-sigma.vercel.app`, but this audit did not verify the live page in a browser.
- The app makes browser-side requests to AniList GraphQL, Tenrai, Kitsu, Jikan, Shikimori, and Google Translate.
- The UI explicitly states that playback is not embedded and video sources are not yet integrated.

## Findings

### P1 — Large catalog data is not used by the app
- `data/catalog.json` is 33,652,097 bytes and `data/catalog.json.gz` is 7,241,179 bytes.
- A complete text scan of `index.html` found no reference to either file.
- `filterLocalCatalog()` exists but is never called by the current catalog loading path.
- Result: these files currently do not provide an offline/stale catalog fallback. They increase repository size and may be unnecessarily included as static assets.

Recommended action: inspect the catalog schema and provenance, then either wire a bounded, paginated fallback into the loader or remove/rebuild the unused data files in a separate change. Do not delete them until their intended role and contents are verified.

### P1 — Catalog availability depends on third-party browser APIs
- `loadCatalog()` starts AniList, Tenrai, Kitsu, and Jikan requests concurrently in the browser.
- It succeeds if at least one provider returns usable records, but reports a full failure if all providers fail.
- The client has timeouts/retries, but no same-origin server proxy or health endpoint is present in the root source tree.
- CORS, rate limits, provider outages, and network restrictions can therefore still make the catalog unreliable.

Recommended action: introduce a same-origin Vercel API layer with per-provider timeouts, bounded concurrency, cache headers, and provider-specific health/error reporting. Keep browser-side fallback while migrating.

### P1 — No actual episode playback integration
- The UI's own notice says viewing is not embedded; episode controls only update a local progress counter.
- AniList/Jikan/Kitsu metadata and episode counts are not video streams.

Recommended action: implement playback only through authorized/licensed embeds or sources, and show a clear unavailable state when none is configured. Do not scrape or redistribute copyrighted video files.

### P2 — Russian title enrichment can be expensive and inconsistent
- `enrichRussianTitles()` can send Shikimori lookup requests for multiple catalog records after each load.
- It runs up to three workers, but it is still browser-side and has no server-side shared cache.
- The fallback title may be English/romaji, so the interface cannot guarantee Russian names for every item.

Recommended action: cache normalized title lookups, throttle requests, retain provider IDs, and prefer official Russian title fields where available.

### P2 — Genre and search completeness need tests
- Genre filters are applied locally to non-AniList providers, using normalized names and tags; provider taxonomies differ.
- Search requests each provider using its own query semantics and then merges results; identical works with alternate titles can remain duplicated or be merged incorrectly.
- The app's local search only searches currently loaded results, not the entire global catalog.

Recommended action: add fixture-based tests for deduplication, title normalization, genre mappings, pagination, empty results, and provider failure combinations.

### P2 — No automated app tests or build pipeline visible in root
- The root listing currently has `index.html`, `README.md`, and `data/`; no `package.json`, test suite, or serverless API route is present on `main`.
- GitHub Pages deployment success is not evidence that external APIs or interactive features work.

Recommended action: add syntax checks and smoke tests, then verify the production URL and Vercel deployment logs after each change.

## Safe implementation order
1. Keep `main` and the currently published site unchanged until a candidate passes checks.
2. Confirm the schema and origin of `data/catalog.json`.
3. Add a small Vercel API health endpoint and one provider proxy on a staging branch.
4. Add provider caching and error isolation; test each provider independently.
5. Add Russian-title caching and catalog merge tests.
6. Integrate a lawful playback provider only after its rights/terms are confirmed.
7. Promote the staging branch only after smoke tests pass.
