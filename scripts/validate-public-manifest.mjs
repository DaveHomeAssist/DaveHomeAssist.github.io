#!/usr/bin/env node
// validate-public-manifest.mjs
// Gate for project-manifest.json, the public project registry (README.md:
// "project-manifest.json is an API"). Enforces the privacy rules and the
// documented entry contract. Throws (exit 1) on the first violation so it can
// run before sync-manifest and in CI.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(__dirname, '..', 'project-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const projects = Array.isArray(manifest.projects) ? manifest.projects : null;
const allowedVisibilities = new Set(['public', 'unlisted', 'isolated']);
// README.md entry shape: status is active, wip, archived, or candidate.
const allowedStatuses = new Set(['active', 'wip', 'archived', 'candidate']);
const categories = manifest.categories && typeof manifest.categories === 'object' ? manifest.categories : {};
const hostingPlatforms = manifest.hostingPlatforms && typeof manifest.hostingPlatforms === 'object' ? manifest.hostingPlatforms : {};

if (!projects) {
  throw new Error('Public manifest must contain a projects array.');
}

if (!manifest.meta || typeof manifest.meta !== 'object' || !manifest.meta.owner) {
  throw new Error('Public manifest must contain meta.owner.');
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.meta.lastUpdated || '')) {
  throw new Error('Public manifest meta.lastUpdated must be a YYYY-MM-DD date.');
}

const ids = new Set();
for (const project of projects) {
  if (!project.id || ids.has(project.id)) {
    throw new Error(`Public manifest contains a missing or duplicate id: ${project.id || '(missing)'}`);
  }
  ids.add(project.id);

  if (!project.name) {
    throw new Error(`Public manifest requires a name for ${project.id}.`);
  }

  if (!allowedVisibilities.has(project.visibility)) {
    throw new Error(`Public manifest rejects visibility "${project.visibility}" for ${project.id}.`);
  }

  if (!allowedStatuses.has(project.status)) {
    throw new Error(`Public manifest rejects status "${project.status}" for ${project.id}.`);
  }

  if (typeof project.featured !== 'boolean') {
    throw new Error(`Public manifest requires a boolean featured flag for ${project.id}.`);
  }

  if (!Object.hasOwn(categories, project.category)) {
    throw new Error(`Public manifest references undefined category "${project.category}" for ${project.id}.`);
  }

  if (!Object.hasOwn(hostingPlatforms, project.hosting)) {
    throw new Error(`Public manifest references undefined hosting "${project.hosting}" for ${project.id}.`);
  }

  if (!/^https:\/\/github\.com\/DaveHomeAssist\/[A-Za-z0-9._-]+\/?$/.test(project.repo || '')) {
    throw new Error(`Public manifest requires a DaveHomeAssist GitHub repository URL for ${project.id}.`);
  }

  if (project.localPath || project.runCommand) {
    throw new Error(`Public manifest rejects localPath/runCommand values for ${project.id}.`);
  }
}

// Relationship fields must resolve inside the registry.
for (const project of projects) {
  const related = [
    ...(project.parentProject ? [project.parentProject] : []),
    ...(Array.isArray(project.dependencies) ? project.dependencies : []),
    ...(Array.isArray(project.dependents) ? project.dependents : []),
  ];
  for (const id of related) {
    if (!ids.has(id)) {
      throw new Error(`Public manifest entry ${project.id} references unknown project id "${id}".`);
    }
  }
}

console.log(`Validated ${projects.length} public-safe projects across ${new Set(projects.map((project) => project.repo)).size} repositories.`);
