#!/usr/bin/env node
// bake-hero-stats.mjs
// Writes the hero counts from project-manifest.json into index.html so the
// numbers are present with JavaScript disabled. Runtime JS still overwrites
// the same elements after load. Counts come from scripts/lib/project-counts.js.
//
// Usage: node scripts/bake-hero-stats.mjs          (rewrite index.html)
//        node scripts/bake-hero-stats.mjs --check  (exit 1 on drift, write nothing)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const countsPath = resolve(__dirname, 'lib/project-counts.js');
const countsGlobal = {};
runInNewContext(readFileSync(countsPath, 'utf8'), countsGlobal, { filename: countsPath });
const { getHeroStats } = countsGlobal.ProjectCounts || {};
if (typeof getHeroStats !== 'function') {
  throw new Error('scripts/lib/project-counts.js did not set ProjectCounts.getHeroStats');
}

const repoRoot = resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check');

const manifestPath = resolve(repoRoot, 'project-manifest.json');
const indexPath = resolve(repoRoot, 'index.html');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const stats = getHeroStats(manifest.projects);

const slots = [
  ['statPublicProjects', stats.public],
  ['statFeaturedProjects', stats.featured],
  ['statActiveProjects', stats.active],
];

let html = readFileSync(indexPath, 'utf8');
let drifted = false;

for (const [id, value] of slots) {
  const pattern = new RegExp(`(<div class="panel-stat-value" id="${id}">)([^<]*)(</div>)`);
  const match = html.match(pattern);
  if (!match) {
    console.error(`Missing hero stat element #${id} in index.html`);
    process.exit(1);
  }
  const next = `${match[1]}${value}${match[3]}`;
  if (match[0] !== next) {
    drifted = true;
    html = html.replace(match[0], next);
  }
}

const summary = `public ${stats.public}, featured ${stats.featured}, active ${stats.active}`;

if (checkOnly) {
  if (drifted) {
    console.error(`Hero stats in index.html differ from project-manifest.json (${summary}).`);
    console.error('Run: npm run bake-stats');
    process.exit(1);
  }
  console.log(`Hero stats match manifest: ${summary}`);
  process.exit(0);
}

if (drifted) {
  writeFileSync(indexPath, html);
  console.log(`Wrote hero stats into index.html: ${summary}`);
} else {
  console.log(`Hero stats already current: ${summary}`);
}
