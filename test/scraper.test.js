import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(new URL('./fixtures/episode-with-transcript.html', import.meta.url), 'utf8');
const scraperSource = fs.readFileSync(new URL('../scraper.js', import.meta.url), 'utf8');

const URL_OK = 'https://open.spotify.com/intl-de/episode/6abc123XYZ?si=deadbeef';

function scrape(page = html, url = URL_OK) {
  const dom = new JSDOM(page, { url, runScripts: 'outside-only' });
  return JSON.parse(JSON.stringify(dom.window.eval(scraperSource)));
}

const anonymousConfig = Buffer.from(JSON.stringify({ isAnonymous: true })).toString('base64');

test('extracts metadata and transcript turns', () => {
  const ep = scrape();
  assert.equal(ep.status, 'ok');
  assert.equal(ep.title, '#211 Was ist die Campfire Method mit Jan Keck');
  assert.equal(ep.show, 'Unboxing New Work');
  assert.equal(ep.showUrl, 'https://open.spotify.com/show/33IjblLOWc7b4SLzWed02x');
  assert.equal(ep.url, 'https://open.spotify.com/episode/6abc123XYZ');
  assert.equal(ep.dateRaw, 'Today');
  assert.equal(ep.duration, '1 hr');
  assert.deepEqual(
    ep.turns.map((t) => [t.speaker, t.lines.length]),
    [['Sprecher*in 1', 3], ['Sprecher*in 2', 1], ['Sprecher*in 1', 2]],
  );
  assert.equal(ep.turns[0].lines[0], 'Bevor es losgeht.');
});

test('the generated-transcript notice is not part of the transcript', () => {
  const all = scrape().turns.flatMap((t) => t.lines).join(' ');
  assert.doesNotMatch(all, /generated automatically/);
});

test('reports a logged-out viewer', () => {
  const page = html.replace(/(<script id="appServerConfig"[^>]*>)[^<]*/, `$1${anonymousConfig}`);
  assert.equal(scrape(page).status, 'login-required');
});

test('falls back to the user widget when the config is unreadable', () => {
  const page = html.replace(/(<script id="appServerConfig"[^>]*>)[^<]*/, '$1not-base64!').replace(/<button data-testid="user-widget-link".*?<\/button>/, '');
  assert.equal(scrape(page).status, 'login-required');
});

test('asks to open the transcript tab', () => {
  const page = html
    .replace('id="transcript-tab" aria-controls="transcript-panel" aria-disabled="false" aria-selected="true"', 'id="transcript-tab" aria-controls="transcript-panel" aria-disabled="false" aria-selected="false"');
  assert.equal(scrape(page).status, 'open-transcript-tab');
});

test('episodes without a transcript tab', () => {
  const page = html.replace(/<button role="tab" id="transcript-tab".*?<\/button>/, '');
  assert.equal(scrape(page).status, 'no-transcript');
});

test('empty transcript panel', () => {
  const page = html.replace(/(<div role="tabpanel" id="transcript-panel"[^>]*>).*?<\/div><\/div><\/section>/s, '$1</div></div></section>');
  assert.equal(scrape(page).status, 'empty');
});

test('pages that are not episodes', () => {
  assert.equal(scrape(html, 'https://open.spotify.com/show/33Ijbl').status, 'not-episode');
});
