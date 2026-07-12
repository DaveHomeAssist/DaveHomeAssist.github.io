# DaveHomeAssist.github.io

Portfolio hub for the DaveHomeAssist estate, and home of the machine readable
project registry that several tools consume.

## project-manifest.json is an API

`project-manifest.json` is the canonical registry of every project in the
account. It is consumed by:

- **This hub** (`index.html`) to render the portfolio
- **graph-explorer** to visualize the ecosystem
- **command-center-061eed** (mirror of the private `ops-hub`) to monitor live
  surfaces and git sync state

Treat changes to it as API changes: keep `id` values stable, update
`meta.lastUpdated` on any edit, and never delete an entry for a repo that
still exists on GitHub (mark it `archived` instead).

### Entry shape

| Field | Meaning |
|---|---|
| `id` | Stable slug; never reuse or rename |
| `status` | `active`, `wip`, `archived`, or `candidate` (added by sweep, pending curation) |
| `featured` | Mirrors the `featured-product` GitHub topic; exactly the set pinned on the profile |
| `visibility` | `public` or `unlisted` (published but not surfaced in hub navigation) |
| `hosting` / `url` | Where the live surface runs, if any |
| `repo` | GitHub URL; update on renames even though GitHub redirects |

### Lifecycle topics

Every repo on GitHub carries exactly one `lifecycle-*` topic
(`active`, `maintained`, `experimental`, `historical`, `reference`).
The manifest `status` field should agree with the repo topic; the topic is
the source of truth.

## Issue tracking convention

GitHub issue creation is restricted account wide. Empty Issues tabs do not
mean inactivity. Tracked work lives in:

- **In-repo issue files** (for example `festival-atlas` closes numbered issue
  files in the repo itself)
- **Notion** for product phase tracking (for example PlotForge phases)

## Local development

Static site, no build. Open `index.html` or serve the directory with any
static file server.
