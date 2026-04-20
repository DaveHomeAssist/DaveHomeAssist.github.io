# Follow-up: Add hub backlinks to standalone project pages

Each of these repos deploys a standalone page with no navigation back to the
DaveHomeAssist homepage. Adding a small fixed-position backlink improves
discoverability and prevents dead-end navigation.

## Pattern

```html
<a href="https://davehomeassist.github.io/"
   style="display:inline-flex;align-items:center;gap:.35rem;position:fixed;
          top:.65rem;left:.85rem;z-index:100;font-size:.7rem;
          letter-spacing:.04em;color:rgba(255,255,255,0.4);
          text-decoration:none;transition:color .15s;"
   onmouseover="this.style.color='currentColor'"
   onmouseout="this.style.color='rgba(255,255,255,0.4)'">&larr; DaveHomeAssist</a>
```

Adjust color values to match each page's theme. For light-themed pages use
`rgba(0,0,0,0.35)` instead.

## Repos needing this change

| Repo | Page | Theme |
|------|------|-------|
| gemini-api-cost-calculator | index.html | Dark (gradient header) |
| NotionWidgets | index.html | Dark |
| trailkeeper | index.html | Light |
| freelance | index.html (JS-rendered) | Dark |
| contractor | index.html (JS-rendered) | Dark |
| web-templates | index.html | Dark (theme switcher) |
| sdlc-tool-stack-map | index.html | Dark |
| shieldbox-security-event-quote-request-v4-gold-master | .html | Dark (theme switcher) |
| garden-os | index.html | Light (earthy) |

## Already done

| Repo | File | Status |
|------|------|--------|
| DaveHomeAssist.github.io | elysium-landing/index.html | Backlink added |
| gemini-api-cost-calculator | docs/index.html | Backlink added |
| NotionWidgets | index.html | Backlink added |
| trailkeeper | index.html | Backlink added |
| freelance | index.html | Backlink added |
| contractor | index.html | Backlink added |
| web-templates | index.html | Backlink added |
| sdlc-tool-stack-map | index.html | Backlink added |
| shieldbox-security-event-quote-request-v4-gold-master | index.html | Backlink added |
| garden-os | index.html | Backlink added |

## Notes

- For JS-rendered pages (freelance, contractor), the backlink should go in the
  static HTML shell above the app root so it's visible during load.
- For pages with theme switchers, use CSS custom properties instead of hardcoded
  color values where practical.
- garden-os has its own internal nav; the backlink could go in the utility header
  area rather than as a fixed overlay.
