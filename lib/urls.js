// URL helpers shared by the service worker and the tests.

const EPISODE_RE = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?episode\/([A-Za-z0-9]+)/;

export function isEpisodeUrl(url) {
  return EPISODE_RE.test(url || '');
}

// Canonical episode URL without query string, hash and "intl-xx" locale prefix.
export function canonicalEpisodeUrl(url) {
  const m = (url || '').match(EPISODE_RE);
  return m ? `https://open.spotify.com/episode/${m[1]}` : '';
}

// Official Spotify login screen, returning to the given page afterwards.
export function loginUrl(returnUrl) {
  return `https://accounts.spotify.com/login?continue=${encodeURIComponent(returnUrl)}`;
}
