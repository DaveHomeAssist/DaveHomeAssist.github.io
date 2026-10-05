> **DEPRECATED** — This file is superseded by `CLAUDE.md`. Issues, session log, and project metadata now live in CLAUDE.md. This file is retained as a historical archive only.

# AGENTS.md

Inherits root rules from `/Users/daverobertson/Code/AGENTS.md`.

## Workspace contract

Read `~/Code/ops-hub/90-governance/WORKSPACE_OPERATING_RULES.md` before project rules, including COMMS (one entry on the shared Agent Communications Page per session).

## Project Overview

GitHub Pages org site for DaveHomeAssist. Contains multiple landing page iterations (v1 through v4 plus current index), a video engineer page, a Vivaldi setup map, and an Elysium Landing subsite. Serves as the public hub for the ecosystem.

## Stack

- Static HTML + CSS (multiple version files)
- GitHub Pages hosting from repo root
- Current hub pages are static assets today; future hub surfaces can use
  app-grade architecture when the product calls for it.

## Key Decisions

- Keep multiple version files for iteration history rather than overwriting
- Elysium Landing lives as a subdirectory within this repo
- Assets and icons are shared across versions

## Issue Tracker

| ID | Severity | Status | Title | Notes |
|----|----------|--------|-------|-------|
| 001 | P1 | open | Elysium Landing contact CTA links to placeholder email | mailto:hello@example.com is non-functional |
| 002 | P1 | open | Video engineer LinkedIn URL points to generic linkedin.com | Missing actual profile path |
| 003 | P2 | open | Elysium nav links hidden on screens under 480px with no fallback | display:none removes all navigation on small phones |
| 004 | P2 | open | Elysium back link uses inline onmouseover/onmouseout | Not keyboard accessible; should use CSS :hover and :focus-visible |
| 005 | P2 | open | Video engineer page has no back link to main portfolio | Users cannot navigate back to the hub |

## Session Log

[2026-03-18] [DaveHomeAssist] [docs] Add AGENTS baseline
[2026-03-19] [DaveHomeAssist] [seo] Nova pass — technical SEO and crawlability audit across all 5 index variants

## Status naming

Name work with one string everywhere (chat status title, session title, Notion
Status Check Runs "Human Name"):

`Project | 🚦 | Phase | Title → state, reason | MM-DD`

- 🚦: 🟢 complete and verified · 🟡 partial · 🔴 not started, blocked or failed · ⚪ unverifiable.
  Add ⏳ scheduled, 🙋 awaiting Dave or 🚧 blocked to 🟡/🔴/⚪, never to 🟢.
- Phase: Research, Design, Build, Audit or Scheduled. MM-DD: date of the latest light change.
- Every light change gets a new name: a `RENAME:` line in chat and the Notion row updated.
- Canonical source: https://github.com/DaveHomeAssist/skills/blob/master/status-naming.md
