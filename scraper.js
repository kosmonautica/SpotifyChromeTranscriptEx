// Injected into the Spotify episode page by background.js (chrome.scripting.executeScript with `files`).
// Must stay a self-contained classic script whose last expression is the result.

function extractEpisode(doc, href) {
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const episodePath = (href.match(/^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(episode\/[A-Za-z0-9]+)/) || [])[1];
  if (!episodePath) return { status: 'not-episode' };

  // The page config embeds whether the viewer is anonymous (base64 encoded JSON).
  let anonymous = null;
  try {
    const cfg = doc.getElementById('appServerConfig');
    if (cfg) anonymous = JSON.parse(atob(cfg.textContent.trim())).isAnonymous;
  } catch (e) {
    anonymous = null;
  }
  if (anonymous === null) anonymous = !doc.querySelector('[data-testid="user-widget-link"]');
  if (anonymous) return { status: 'login-required' };

  const title = text(doc.querySelector('[data-testid="episodeTitle"]'));
  if (!title) return { status: 'not-episode' };

  const tab = doc.getElementById('transcript-tab');
  if (!tab || tab.getAttribute('aria-disabled') === 'true') return { status: 'no-transcript' };
  if (tab.getAttribute('aria-selected') !== 'true') return { status: 'open-transcript-tab' };

  // Speaker headers are bold "marginal" text, transcript lines carry dir="auto".
  // Chapter headings inside the transcript use the same bold style, so they are filtered out:
  // by title when the Chapters panel is in the DOM, otherwise by heuristic (a label that occurs
  // once and has four or more words while other labels repeat is a heading, not a speaker).
  const panel = doc.getElementById('transcript-panel');
  const spans = [...(panel ? panel.querySelectorAll('span[data-encore-id="text"]') : [])];
  const chapterTitles = new Set(
    [...doc.querySelectorAll('#chapters-panel [data-encore-id="listRowTitle"]')].map(text).filter(Boolean)
  );
  const counts = new Map();
  for (const span of spans) {
    if (!span.classList.contains('encore-text-marginal-bold')) continue;
    const value = text(span);
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  }
  const hasRepeatedSpeaker = [...counts.values()].some((n) => n > 1);
  const isHeading = (value) =>
    chapterTitles.has(value) ||
    (hasRepeatedSpeaker && counts.get(value) === 1 && value.split(' ').length >= 4);

  const turns = [];
  for (const span of spans) {
    const value = text(span);
    if (!value) continue;
    if (span.classList.contains('encore-text-marginal-bold')) {
      if (isHeading(value)) continue;
      const last = turns[turns.length - 1];
      if (!last || last.speaker !== value) turns.push({ speaker: value, lines: [] });
    } else if (span.getAttribute('dir') === 'auto') {
      if (!turns.length) turns.push({ speaker: '', lines: [] });
      turns[turns.length - 1].lines.push(value);
    }
  }
  const filled = turns.filter((t) => t.lines.length);
  if (!filled.length) return { status: 'empty' };

  const showLink = doc.querySelector('[data-testid="entity-header"] a[href^="/show/"]');
  const release = doc.querySelector('meta[property="music:release_date"]');
  const dateEl = doc.querySelector('[data-testid="action-bar"] p.encore-text-body-small');
  const progress = doc.querySelector('[data-testid^="episode-progress"]');

  return {
    status: 'ok',
    title,
    show: text(doc.querySelector('[data-testid="showTitle"]')),
    showUrl: showLink ? 'https://open.spotify.com' + showLink.getAttribute('href').split('?')[0] : '',
    url: 'https://open.spotify.com/' + episodePath,
    releaseDate: release ? release.getAttribute('content') : '',
    dateRaw: text(dateEl),
    duration: text(progress).replace(/\s+left$/i, ''),
    turns: filled,
  };
}

extractEpisode(document, location.href);
