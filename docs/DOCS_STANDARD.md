# DOCS_STANDARD.md — DaveHomeAssist Portfolio Documentation Standard

> **Status:** canonical
> **Version:** 1.1 (2026-07-10) — incorporates governance review findings; v1.0 same-day
> **Owner:** DaveHomeAssist
> **Home:** `DaveHomeAssist.github.io/docs/DOCS_STANDARD.md`
> **Derived from:** prompt-lab `docs-style-guide.md` (2026-03) and garden-os `DOCUMENTATION_AUDIT_2026-03-16.md`, promoted to portfolio scope.

This file defines the documentation contract for every repository listed in
`project-manifest.json`. Repo-level style guides may extend it but may not
contradict it.

---

## 1. Status labels

Every **in-scope** markdown doc (see §8, Audit scope) carries a status line
near the top:

```
> **Status:** canonical | active | working | audit | historical | generated
```

- `canonical` — the source of truth for a domain. One per domain per repo.
- `active` — current supporting doc that reflects the live system.
- `working` — session-specific or operational context; may change quickly.
- `audit` — time-bounded review or assessment. Must carry a date suffix.
- `historical` — retained for context; not authoritative.
- `generated` — derived output; edit the source, not the file.

## 2. Precedence rules (when docs disagree)

Precedence depends on the information type:

| Information type | Wins |
|---|---|
| System behavior, APIs, schemas | The code, then the `canonical` doc |
| Forward plans, priorities | Root `ROADMAP.md` |
| Ownership, licensing, policy | The `canonical` doc in the hub repo (this file, LICENSE policy) |
| Operational/run instructions | The most recently dated `active` doc; stale ones get relabeled `historical` |
| Portfolio registry (tiers, status, visibility) | `project-manifest.json` |

When a contradiction is found, the fix is to relabel or edit the losing doc
in the same change — do not leave two docs claiming authority.

## 3. Repo tiers

Each repo declares its tier in `project-manifest.json` via the `docTier`
field (`1`, `2`, `3`). The tier defines the minimum required docs.

| Tier | Definition | Required |
|------|-----------|----------|
| **1 — Flagship** | Active product with a forward plan | `README.md`, `LICENSE`, agent entrypoint (§5), `CHANGELOG.md`, `ROADMAP.md`, `docs/` folder, `docs/DOCS_INVENTORY.md` |
| **2 — Standard** | Maintained app or tool | `README.md`, `LICENSE`, agent entrypoint (§5), `CHANGELOG.md` |
| **3 — Minimal** | Landing page, candidate, experiment, archive | `README.md` (purpose + one-line status), `LICENSE` |

**Waivers.** A repo may waive a specific requirement (e.g. `CHANGELOG.md` on
a repo that never ships versioned changes) by recording it in the manifest:

```json
"docWaivers": [{ "file": "CHANGELOG.md", "reason": "static reference site, no releases" }]
```

The audit treats a waived file as satisfied but reports the waiver count.
Archived repos freeze at their tier; their README gains
`> **Status:** historical — archived YYYY-MM-DD` and the audit skips all
other requirements.

## 4. Canonical root singletons

Uppercase names at repo root are reserved for exactly these roles. **These
uppercase singletons — including `docs/DOCS_INVENTORY.md` — are the explicit
exemption to the kebab-case rule in §6.**

| File | Role | Rules |
|------|------|-------|
| `README.md` | Public entry point | What it is, live URL, how to run, doc index link |
| `LICENSE` | License / rights notice | See §7 |
| `CLAUDE.md` / `AGENTS.md` | Agent operating context | See §5 |
| `CHANGELOG.md` | Shipped history | Newest first, dated entries. `progress.md` / `MILESTONE_LOG.md` variants fold in or move to `docs/` as `historical`. |
| `ROADMAP.md` | The one forward-looking plan | Exactly this name, at root, Tier 1 only. Specialized roadmaps (graphics, mobile, modernization) live in `docs/` and are linked from `ROADMAP.md` as sub-plans. |
| `ARCHITECTURE.md` | System architecture (optional) | Only when the system warrants it. |
| GitHub community files | `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md` | Permitted at root when the repo needs them; out of audit sprawl scope. |

**No other markdown files at root.** Everything else lives under `docs/`
(or `docs/working/` if short-lived). Root files like `HANDOFF.md`,
`DECISION_LOG.md`, `NEXT_EXECUTOR_PROMPT.md`, `CURRENT_*`, `SESSION_*` move.

## 5. Agent entrypoints (CLAUDE.md and AGENTS.md)

Different tools auto-discover different files: Claude Code loads `CLAUDE.md`;
Codex and several other agents load `AGENTS.md`. **Both recognized
entrypoints must remain functional** — a pointer-only stub silently weakens
whichever tool reads it.

The rule is single-source, dual-render:

- `CLAUDE.md` is the **authored canonical source** of agent operating context.
- `AGENTS.md` is a **generated full copy** of `CLAUDE.md` (not a pointer),
  carrying a `> **Status:** generated — source: CLAUDE.md` header. Regenerate
  on every `CLAUDE.md` edit (copy step in the repo's build script, a
  pre-commit hook, or the doc-audit `--fix` pass).
- Tool-specific overrides, if ever needed, go in a clearly marked trailing
  section of the generated file — never by forking the two files' shared body.

Every agent entrypoint includes this block:

```
## Documentation standard
This repo follows the portfolio DOCS_STANDARD
(https://github.com/DaveHomeAssist/DaveHomeAssist.github.io/blob/main/docs/DOCS_STANDARD.md).
Tier: <1|2|3>. When you touch this repo: keep required docs current,
add a Status label to any doc you create or edit, do not create new
root-level markdown files outside the canonical singletons, and update
docs/DOCS_INVENTORY.md when adding or removing docs (Tier 1).
```

## 6. The docs/ folder

- Filenames are `kebab-case.md`, **except** the uppercase singleton
  `DOCS_INVENTORY.md` (§4 exemption).
- Date suffixes (`-YYYY-MM-DD`) only for time-bounded audits, reports, snapshots.
- Tier 1 repos maintain `docs/DOCS_INVENTORY.md`: a table of Path / Scope /
  Status / Notes for every in-scope doc, plus the repo's source-of-truth rules.
- Public-facing HTML docs are authored in their source location (e.g.
  `web/public/`); a published copy under `docs/` is `generated`.

## 7. Licensing

`LICENSE` at root is required at all tiers. The portfolio default is a
**proprietary all-rights-reserved notice**: a copyright line
(`Copyright © <year> Dave Robertson. All rights reserved.`) plus an explicit
no-license-granted statement. This is a rights notice, not an OSS license
template. Exceptions (repos intentionally released under MIT, CC, etc.) are
recorded per-repo in `project-manifest.json` as `"license": "<spdx-or-note>"`;
absence of the field means the proprietary default.

## 8. Compliance audit

`scripts/doc-audit.py` in the hub repo reads `project-manifest.json` and
inspects each repo.

**Discovery & reachability.** The audit inspects local clones under a given
directory (CI clones public/unlisted repos fresh; private repos require a
token). A repo that cannot be inspected — private without credentials,
network failure, missing clone — is reported **`UNVERIFIED`**, which is
distinct from `FAIL`. Archived repos are reported `ARCHIVED` and only
checked for the README status line.

**Audit scope (what "every doc" means).** In scope: markdown files at repo
root and under `docs/`, authored in this portfolio. Out of scope:
`node_modules/` and any vendored/dependency trees, build output directories,
submodules, template fixtures (`templates/`, `fixtures/`), GitHub community
files (§4), and files labeled `generated` (label presence is still checked,
content is not).

**Results & exit codes.** Per repo: `PASS`, `FAIL`, `UNVERIFIED`, `ARCHIVED`.
Process exit code: `0` all pass or waived, `1` any FAIL, `2` audit could not
run. Waivers are honored (§3) and counted in the summary.

**Done state:** 100% of verifiable repos PASS, zero root sprawl, every
in-scope doc labeled.

## 9. Migration procedure

When moving a doc to comply with this standard:

1. Use `git mv` to preserve history.
2. Grep the repo (and the hub's cross-project pages) for inbound links and
   update them in the same commit.
3. If the old path is externally linked (published URL), leave a one-line
   redirect stub for one release cycle, labeled `historical`.
4. Re-run `doc-audit.py` on the repo before pushing.

Portfolio-specific migration state (which repos owe what) lives in the dated
audit reports produced by `doc-audit.py`, **not** in this standard — see the
latest `doc-audit-YYYY-MM-DD.csv` in the hub repo.
