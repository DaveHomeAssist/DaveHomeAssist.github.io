# CLAUDE.md

Inherits root rules from `/Users/daverobertson/Desktop/Code/AGENTS.md`.

## Project Overview

GitHub Pages org site for DaveHomeAssist. Contains the project hub (index.html), a private "Mission Control" hub (private-hub.html, noindexed), a public hub, a video engineer page, a Vivaldi setup map, a script-writing-machine page, and a homelab-os subsite. Serves as the public hub for the ecosystem. (The v1–v4 archive pages and Elysium Landing subsite were removed from the repo.)

## Stack

- Static HTML + CSS (multiple version files)
- GitHub Pages hosting from repo root
- No build step, no framework

## Key Decisions

- Keep multiple version files for iteration history rather than overwriting
- Elysium Landing lives as a subdirectory within this repo
- Assets and icons are shared across versions

## Manifest Sync

`project-manifest.json` is the single source of truth for the project list. Both `private-hub.html` and `index.html` embed a `FALLBACK_MANIFEST` block so the hubs still render if the fetch fails. After editing `project-manifest.json`, run `npm run sync-manifest` to propagate changes to both hubs' embedded fallbacks. Never edit the `FALLBACK_MANIFEST` blocks directly.

## Documentation Maintenance

- **Issues**: Track in the issue tracker table below
- **Session log**: Append to `/Users/daverobertson/Desktop/Code/95-docs-personal/today.csv` after each meaningful change

## Issue Tracker

| ID | Severity | Status | Title | Notes |
|----|----------|--------|-------|-------|
| 001 | P1 | obsolete | Elysium Landing contact CTA links to placeholder email | Elysium pages removed from repo; issue no longer applies |
| 002 | P1 | resolved | Video engineer LinkedIn URL points to generic linkedin.com | Fixed: href updated to https://www.linkedin.com/in/daverobertson93/ |
| 003 | P2 | obsolete | Elysium nav links hidden on screens under 480px with no fallback | Elysium pages removed from repo; issue no longer applies |
| 004 | P2 | obsolete | Elysium back link uses inline onmouseover/onmouseout | Elysium pages removed from repo; issue no longer applies |
| 005 | P2 | open | Video engineer page has no back link to main portfolio | Users cannot navigate back to the hub |
| 006 | P1 | resolved | Public manifest exposed 11 more private repo URLs plus localPath/runCommand values | Fixed 2026-07-03: blanked 10 private URLs, repointed BPMDelayCalc to public bpm-delay-calculator, cleared all localPath/runCommand |
| 007 | P2 | resolved | private-hub.html was indexable and listed in sitemap.xml | Fixed 2026-07-03: robots meta set to noindex,nofollow; removed from sitemap |
| 008 | P2 | resolved | index.html footer linked to missing archives/index-v1.html (live 404) | Fixed 2026-07-03: link removed |

## Session Log

[2026-03-18] [DaveHomeAssist] [docs] Add AGENTS baseline
[2026-03-19] [DaveHomeAssist] [seo] Nova pass — technical SEO and crawlability audit across all 5 index variants
