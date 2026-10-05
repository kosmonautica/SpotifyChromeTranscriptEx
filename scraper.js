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
  const turns = [];
  const panel = doc.getElementById('transcript-panel');
  for (const span of panel ? panel.querySelectorAll('span[data-encore-id="text"]') : []) {
    const value = text(span);
    if (!value) continue;
    if (span.classList.contains('encore-text-marginal-bold')) {
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
