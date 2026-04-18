# CLAUDE.md

Inherits root rules from `/Users/daverobertson/Desktop/Code/AGENTS.md`.

## Project Overview

GitHub Pages org site for DaveHomeAssist. Contains multiple landing page iterations (v1 through v4 plus current index), a video engineer page, a Vivaldi setup map, and an Elysium Landing subsite. Serves as the public hub for the ecosystem.

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
| 001 | P1 | open | Elysium Landing contact CTA links to placeholder email | mailto:hello@example.com is non-functional |
| 002 | P1 | resolved | Video engineer LinkedIn URL points to generic linkedin.com | Fixed: href updated to https://www.linkedin.com/in/daverobertson93/ |
| 003 | P2 | open | Elysium nav links hidden on screens under 480px with no fallback | display:none removes all navigation on small phones |
| 004 | P2 | open | Elysium back link uses inline onmouseover/onmouseout | Not keyboard accessible; should use CSS :hover and :focus-visible |
| 005 | P2 | open | Video engineer page has no back link to main portfolio | Users cannot navigate back to the hub |

## Session Log

[2026-03-18] [DaveHomeAssist] [docs] Add AGENTS baseline
[2026-03-19] [DaveHomeAssist] [seo] Nova pass — technical SEO and crawlability audit across all 5 index variants
