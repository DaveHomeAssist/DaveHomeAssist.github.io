#!/usr/bin/env node
// sync-manifest.mjs
// Propagates project-manifest.json into the FALLBACK_MANIFEST blocks in
// private-hub.html and index.html so the three copies never drift.
//
// Usage: node scripts/sync-manifest.mjs
//        (or: npm run sync-manifest)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const manifestPath = resolve(repoRoot, 'project-manifest.json');
const targets = [
  resolve(repoRoot, 'private-hub.html'),
  resolve(repoRoot, 'index.html'),
];

const manifestRaw = readFileSync(manifestPath, 'utf8');
// Validate JSON and re-serialise with 2-space indent for stable diffs.
const manifestObj = JSON.parse(manifestRaw);
const manifestPretty = JSON.stringify(manifestObj, null, 2);

const blockRegex = /const FALLBACK_MANIFEST = \{[\s\S]*?\n\};/;
const replacement = `const FALLBACK_MANIFEST = ${manifestPretty};`;

let ok = true;
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
  } else {
    writeFileSync(file, after, 'utf8');
    console.log(`  [wrote] ${file}`);
  }
}

console.log(`\nSource: ${manifestPath}`);
console.log(`Projects: ${manifestObj.projects?.length ?? 'n/a'}`);
console.log(`Last updated: ${manifestObj.meta?.lastUpdated ?? 'n/a'}`);

process.exit(ok ? 0 : 1);
