#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(__dirname, '..', 'project-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const projects = Array.isArray(manifest.projects) ? manifest.projects : null;
const allowedVisibilities = new Set(['public', 'unlisted', 'isolated']);

if (!projects) {
  throw new Error('Public manifest must contain a projects array.');
}

const ids = new Set();
for (const project of projects) {
  if (!project.id || ids.has(project.id)) {
    throw new Error(`Public manifest contains a missing or duplicate id: ${project.id || '(missing)'}`);
  }
  ids.add(project.id);

  if (!allowedVisibilities.has(project.visibility)) {
    throw new Error(`Public manifest rejects visibility "${project.visibility}" for ${project.id}.`);
  }

  if (!/^https:\/\/github\.com\/DaveHomeAssist\/[A-Za-z0-9._-]+\/?$/.test(project.repo || '')) {
    throw new Error(`Public manifest requires a DaveHomeAssist GitHub repository URL for ${project.id}.`);
  }

  if (project.localPath || project.runCommand) {
    throw new Error(`Public manifest rejects localPath/runCommand values for ${project.id}.`);
  }
}

console.log(`Validated ${projects.length} public-safe projects across ${new Set(projects.map((project) => project.repo)).size} repositories.`);
