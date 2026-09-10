#!/usr/bin/env node
// sync-manifest.mjs
// Propagates project-manifest.json into the FALLBACK_MANIFEST blocks embedded
// in every hub page that consumes the manifest, so the copies never drift.
//
// Usage: node scripts/sync-manifest.mjs          (rewrite stale fallbacks)
//        node scripts/sync-manifest.mjs --check  (exit 1 on drift, write nothing)
//        (or: npm run sync-manifest / npm run check-manifest)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check');

const manifestPath = resolve(repoRoot, 'project-manifest.json');
// Every page that embeds a FALLBACK_MANIFEST block. Add new hub pages here.
const FALLBACK_TARGETS = [
  'index.html',
  'public-hub.html',
  'private-hub.html',
];
const targets = FALLBACK_TARGETS.map((file) => resolve(repoRoot, file));

const manifestRaw = readFileSync(manifestPath, 'utf8');
// Validate JSON and re-serialise with 2-space indent for stable diffs.
const manifestObj = JSON.parse(manifestRaw);
const manifestPretty = JSON.stringify(manifestObj, null, 2);

const blockRegex = /const FALLBACK_MANIFEST = \{[\s\S]*?\n\};/;
const replacement = `const FALLBACK_MANIFEST = ${manifestPretty};`;

let ok = true;
let drifted = 0;
for (const file of targets) {
  const before = readFileSync(file, 'utf8');
  if (!blockRegex.test(before)) {
    console.error(`  [skip] ${file} — no FALLBACK_MANIFEST block found`);
    ok = false;
    continue;
  }
  const after = before.replace(blockRegex, replacement);
  if (after === before) {
    console.log(`  [ok]   ${file} — already in sync`);
  } else if (checkOnly) {
    console.error(`  [drift] ${file} — FALLBACK_MANIFEST differs from project-manifest.json`);
    drifted += 1;
  } else {
    writeFileSync(file, after, 'utf8');
    console.log(`  [wrote] ${file}`);
  }
}

console.log(`\nSource: ${manifestPath}`);
console.log(`Projects: ${manifestObj.projects?.length ?? 'n/a'}`);
console.log(`Last updated: ${manifestObj.meta?.lastUpdated ?? 'n/a'}`);

if (checkOnly && drifted > 0) {
  console.error(`\n${drifted} fallback block(s) out of sync. Run: npm run sync-manifest`);
  ok = false;
}

process.exit(ok ? 0 : 1);
