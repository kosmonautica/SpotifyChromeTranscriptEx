import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMarkdown, normalizeDate } from '../lib/markdown.js';
import { isEpisodeUrl, canonicalEpisodeUrl, loginUrl } from '../lib/urls.js';

const NOW = new Date(2026, 9, 5, 12, 0, 0); // 2026-10-05

const episode = {
  status: 'ok',
  title: '#211 Was ist "die" Campfire Method',
  show: 'Unboxing New Work',
  showUrl: 'https://open.spotify.com/show/33Ijbl',
  url: 'https://open.spotify.com/episode/6abc123XYZ',
  releaseDate: '',
  dateRaw: 'Today',
  duration: '1 hr',
  turns: [
    { speaker: 'Sprecher*in 1', lines: ['Bevor es losgeht.', 'Willkommen.'] },
    { speaker: 'Sprecher*in 2', lines: ['Vielen Dank.'] },
    { speaker: 'Sprecher*in 1', lines: ['Gern.'] },
  ],
};

test('builds an Obsidian note with a wikilink header and speaker turns', () => {
  const md = buildMarkdown(episode, NOW);
  assert.ok(md.startsWith('# Podcast-Episode: '), 'the note starts with the header, no frontmatter');
  assert.doesNotMatch(md, /^---$/m);
  assert.match(
    md,
    /^# Podcast-Episode: \[\[211 Was ist "die" Campfire Method\]\]\n## Podcast: \[\[Unboxing New Work\]\]\n## URL der Episode: \[\[https:\/\/open\.spotify\.com\/episode\/6abc123XYZ\]\]\n## \[\[2026-10-05\]\]\n## Länge: \[\[1 hr\]\]\n\n## Transcript/m,
  );
  assert.match(md, /^## Transcript\n\n\*\*Sprecher\\\*in 1\*\*\n\nBevor es losgeht\. Willkommen\.\n\n\*\*Sprecher\\\*in 2\*\*\n\nVielen Dank\.\n\n\*\*Sprecher\\\*in 1\*\*\n\nGern\.\n$/m);
});

test('wikilinks drop characters Obsidian does not allow', () => {
  const md = buildMarkdown({ ...episode, show: 'A/B: [Show] #1' }, NOW);
  assert.match(md, /^## Podcast: \[\[A B Show 1\]\]$/m);
});

test('omits properties that are unknown', () => {
  const md = buildMarkdown({ ...episode, show: '', showUrl: '', dateRaw: '', duration: '' }, NOW);
  assert.doesNotMatch(md, /^## (Podcast|Länge):/m);
  assert.doesNotMatch(md, /^## \[\[/m);
});

test('normalizeDate', () => {
  assert.equal(normalizeDate('Today', NOW), '2026-10-05');
  assert.equal(normalizeDate('Yesterday', NOW), '2026-10-04');
  assert.equal(normalizeDate('Heute', NOW), '2026-10-05');
  assert.equal(normalizeDate('Sep 29', NOW), '2026-09-29');
  assert.equal(normalizeDate('Dec 24', NOW), '2025-12-24');
  assert.equal(normalizeDate('Sep 29, 2023', NOW), '2023-09-29');
  assert.equal(normalizeDate('29. Sep. 2023', NOW), '2023-09-29');
  assert.equal(normalizeDate('2024-02-03T10:00:00Z', NOW), '2024-02-03');
  assert.equal(normalizeDate('sometime', NOW), 'sometime');
  assert.equal(normalizeDate('', NOW), '');
});

test('URL helpers', () => {
  assert.equal(isEpisodeUrl('https://open.spotify.com/episode/6abc123XYZ?si=1'), true);
  assert.equal(isEpisodeUrl('https://open.spotify.com/intl-de/episode/6abc123XYZ'), true);
  assert.equal(isEpisodeUrl('https://open.spotify.com/show/33Ijbl'), false);
  assert.equal(isEpisodeUrl('https://example.com/episode/abc'), false);
  assert.equal(isEpisodeUrl(undefined), false);
  assert.equal(canonicalEpisodeUrl('https://open.spotify.com/intl-de/episode/6abc123XYZ?si=1#x'), 'https://open.spotify.com/episode/6abc123XYZ');
  assert.equal(loginUrl('https://open.spotify.com/episode/a'), 'https://accounts.spotify.com/login?continue=https%3A%2F%2Fopen.spotify.com%2Fepisode%2Fa');
});

test('a custom template is filled and empty lines are dropped', () => {
  const tpl = '# {{title}}\nShow: {{show|wikilink}}\nLength: {{duration}}\n\n{{transcript}}';
  const md = buildMarkdown({ ...episode, show: '', duration: '' }, NOW, tpl);
  assert.equal(md.split('\n')[0], '# #211 Was ist "die" Campfire Method');
  assert.doesNotMatch(md, /Show:|Length:/);
  assert.match(md, /\*\*Sprecher\\\*in 1\*\*\n\nBevor es losgeht\./);
  assert.ok(md.endsWith('Gern.\n'));
});
