import { readFileSync } from 'node:fs';

const tag = process.argv[2];
if (!tag?.startsWith('v')) {
  throw new Error('Usage: node scripts/extract_release_notes.mjs vX.Y.Z');
}

const releaseNotes = readFileSync('docs/release-notes.md', 'utf8');
const heading = `## ${tag}`;
const start = releaseNotes.indexOf(heading);
if (start === -1) {
  throw new Error(`No release notes section found for ${tag}`);
}

const next = releaseNotes.indexOf('\n## ', start + heading.length);
const section = releaseNotes
  .slice(start, next === -1 ? undefined : next)
  .trim();

const body = section
  .replace(/^##[^\n]*\n?/, '')
  .trim();

if (!body) {
  throw new Error(`Release notes section for ${tag} is empty`);
}

process.stdout.write(`${body}\n`);
