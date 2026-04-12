# Dave HomeAssist — Feature Analysis

**Date:** 2026-03-25
**Project:** dave-homeassist
**Stack:** Static HTML/CSS, GitHub Pages, no JavaScript framework, no build step

---

## Summary Table

| Feature | Status | Data Source / Persistence | Critical Gap |
|---|---|---|---|
| Portfolio Landing Page (index.html) | Complete | Static HTML, hardcoded project data | Project list is manually maintained in HTML |
| Featured Project Cards (3 Flagships) | Complete | Static HTML with SVG thumbnail patterns | Thumbnail patterns are inline SVG, not screenshots |
| Full Project Table (Searchable/Filterable) | Complete | Static HTML table with JS filter/search | Adding/removing projects requires HTML edits |
| Light/Dark Mode | Complete | CSS `prefers-color-scheme` media query | No manual toggle; follows OS preference only |
| Script Writing Machine (Prompt Lab Agent) | Complete | Anthropic API (streaming), in-memory only | API key must be hardcoded or passed; no key management |
| Video Engineer Portfolio Page | Complete | Static HTML, no external data | LinkedIn URL is placeholder (`linkedin.com`) |
| Vivaldi Dev Setup Map | Complete | Static HTML, interactive accordion | Pure reference document; no persistence |
| SEO / Open Graph Metadata | Complete | Meta tags, canonical URL, OG/Twitter cards | OG image points to favicon; no custom social image |
| Accessibility Features | Partial | Skip-nav, focus-visible, aria-labels, reduced-motion | Video engineer page has no back-to-portfolio link |
| Responsive Design | Complete | CSS media queries at 960/720/620/600px | Project table requires horizontal scroll on mobile |
| Intersection Observer Animations | Complete | `js-reveal` class + IntersectionObserver | Gracefully disabled with prefers-reduced-motion |
| GitHub Profile Link | Complete | Header nav link to DaveHomeAssist GitHub | No other social links |

---

## Detailed Feature Analysis

### 1. Portfolio Landing Page

**Problem it solves:** Serves as the public hub for the DaveHomeAssist ecosystem — a single page that showcases the portfolio, links to live projects, and provides context about the builder.

**Implementation:** `index.html` is a polished single-page site with: sticky header with nav, hero section with CTA buttons and project preview chips, about section with tech stack pills and stats (14 tools shipped, 0 backend servers, 100% browser-native), 3 featured project cards with SVG-generated thumbnails, a full project table with search and category filter chips, and a minimal footer. Typography uses Manrope (display/body) and IBM Plex Mono (data/labels). Color system uses CSS custom properties with both dark and light mode variants.

**Tradeoffs and limitations:**
- All project data is hardcoded in HTML. Adding or updating a project requires editing the HTML source directly.
- No JSON/YAML data source that could be consumed by a build step or CMS.
- The featured cards use inline SVG patterns as thumbnails rather than actual screenshots, which is creative but does not show the real product UI.

### 2. Search and Filter System

**Problem it solves:** Lets visitors quickly find specific projects in the portfolio table by keyword search or category filter.

**Implementation:** JavaScript at the bottom of `index.html` implements: a search input that filters table rows by text content, filter chips that toggle category visibility, IntersectionObserver for staggered reveal animations on cards, and keyboard shortcut (`/`) to focus the search field. Filter state is managed via `is-active` class on chips and `is-hidden` class on rows.

**Tradeoffs and limitations:**
- Filter and search state is not persisted; refreshing the page resets everything.
- The filter chips and project data are tightly coupled to the HTML structure.

### 3. Script Writing Machine (Prompt Lab Agent)

**Problem it solves:** An AI-powered advertising script generator that takes brand/product info, audience, duration, format, and tone inputs and generates a structured screenplay via the Anthropic API.

**Implementation:** `script-writing-machine.html` is a self-contained two-panel page: left panel is a form card (brand, tagline, description, audience, duration, format, tone chips), right panel is an output panel with streaming display. Uses `fetch()` against `https://api.anthropic.com/v1/messages` with the `claude-sonnet-4-20250514` model, streaming enabled. The prompt is constructed from form data with specific word-count targeting based on duration. Output streams via SSE parsing of `content_block_delta` events. Includes copy-to-clipboard, word count, and generation time metadata.

**Tradeoffs and limitations:**
- The API call is made directly from the browser. No API key is visible in the code, which means either: (a) CORS will block the request without a proxy, or (b) the key is expected to be injected somehow. This is the most significant implementation gap — the feature cannot work as deployed without an API key strategy.
- No conversation history or prompt versioning.
- Single-generation only; no A/B comparison.

### 4. Video Engineer Portfolio Page

**Problem it solves:** A standalone portfolio/resume page for Dave Robertson's video engineering work — LED installs, live events, touring, and broadcast systems.

**Implementation:** `video-engineer.html` is a richly designed single page with: sticky topbar with brand mark, hero section with proof metrics panel (15+ years, 200+ LED builds, 4 touring acts, 24/7 on-call), signal strip with capability cards, experience timeline, gear/skills section, and contact CTA. Uses Impact/Arial Narrow/Courier New typography with a gold-on-black color scheme. The design aesthetic is broadcast/production-industry appropriate.

**Tradeoffs and limitations:**
- LinkedIn URL in the nav points to generic `linkedin.com` without the actual profile path (documented as issue 002).
- No back link to the main portfolio page (documented as issue 005).
- Contact CTA likely uses a placeholder email address.
- No photos or video clips of actual work — all content is text-based.

### 5. Vivaldi Dev Setup Map

**Problem it solves:** An interactive reference document that maps out a recommended Vivaldi browser configuration for development work — profiles, workspaces, tab stacks, pinned tabs, and organizational rules.

**Implementation:** `vivaldi-setup-map.html` renders a structured dashboard with: hero explaining the Profiles > Workspaces > Tab Stacks hierarchy, profile table, core rules list, 7 expandable workspace accordions (Inbox, Active Build, Research, Debug, AI/Prompting, Deploy/Ops, Archive), pinned tabs reference, rollout plan, and a decision framework for when to use each layer. JavaScript handles accordion toggle with `aria-expanded` state.

**Tradeoffs and limitations:**
- Purely informational; no interactivity beyond accordions.
- Could benefit from being a printable one-pager or embeddable widget.
- Workspace recommendations reference specific projects (Prompt Lab, Trailkeeper, Garden OS, NotionWidgets) that may change.

### 6. Light/Dark Mode

**Problem it solves:** Ensures the portfolio page is comfortable to read in both light and dark environments.

**Implementation:** `index.html` uses `@media (prefers-color-scheme: light)` to override all CSS custom properties with light-mode equivalents. The dark theme is the default. The sub-pages (`video-engineer.html`, `vivaldi-setup-map.html`, `script-writing-machine.html`) are dark-only with no light mode override.

**Tradeoffs and limitations:**
- No manual toggle. Users cannot override their OS preference.
- Sub-pages being dark-only creates an inconsistent experience if the user is in light mode.

---

## Top 3 Priorities

1. **Fix broken links** — The Video Engineer page has a placeholder LinkedIn URL and no back-to-portfolio link. The Script Writing Machine needs an API key strategy (proxy or env injection) to function. These are P1 usability blockers documented in the project's own issue tracker.

2. **Add a data layer for the project table** — Moving project metadata out of HTML into a JSON file (or inline `<script>` data block) would make the portfolio maintainable as the project count grows. Currently every project change requires careful HTML surgery.

3. **Unify sub-page design consistency** — The four HTML pages use four different design systems (portfolio=Manrope/teal-amber, script-agent=Inter/purple, video-engineer=Impact/gold, vivaldi-map=Inter/blue-teal). A shared CSS foundation or at minimum consistent back-navigation would make the site feel like one product rather than four disconnected pages.
