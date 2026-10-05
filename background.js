import { buildMarkdown } from './lib/markdown.js';
import { loadTemplate } from './lib/defaults.js';
import { isEpisodeUrl, loginUrl } from './lib/urls.js';

const GREEN = '#1db954';
const RED = '#d93025';

const HINT = 'Open a podcast episode page on Spotify and make the "Transcript" tab visible, then click the icon again.';

const MESSAGES = {
  'not-episode': HINT,
  'no-transcript': 'This episode has no transcript.',
  'open-transcript-tab': HINT,
  empty: 'The transcript is empty or still loading. Try again in a moment.',
  'copy-failed': 'Could not write to the clipboard.',
  'login-required': 'You are not logged in. Redirecting to the Spotify login ...',
};

// Runs inside the page. execCommand works without a user gesture thanks to "clipboardWrite".
async function writeClipboard(text) {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (ok) return true;
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

// Runs inside the page: short, non-interactive notice.
function showToast(message) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText =
    'all:initial;position:fixed;top:16px;right:16px;z-index:2147483647;display:block;box-sizing:border-box;' +
    'max-width:320px;padding:12px 16px;border-radius:8px;background:#242424;color:#fff;' +
    'font:14px/1.4 sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.5);pointer-events:none';
  // On the root element so a transformed or clipped <body> cannot hide it.
  document.documentElement.appendChild(el);
  setTimeout(() => el.remove(), 8000);
}

async function flashBadge(tabId, text, color, ms) {
  await chrome.action.setBadgeBackgroundColor({ tabId, color });
  await chrome.action.setBadgeText({ tabId, text });
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {}), ms);
}

async function fail(tabId, key) {
  const message = MESSAGES[key];
  await chrome.scripting.executeScript({ target: { tabId }, func: showToast, args: [message] }).catch(() => {});
  await flashBadge(tabId, '!', RED, 5000);
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!isEpisodeUrl(tab.url)) return fail(tab.id, 'not-episode');
  try {
    const [{ result: episode }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['scraper.js'] });
    if (episode.status === 'login-required') {
      await fail(tab.id, 'login-required');
      return chrome.tabs.update(tab.id, { url: loginUrl(tab.url) });
    }
    if (episode.status !== 'ok') return fail(tab.id, episode.status);

    const markdown = buildMarkdown(episode, new Date(), await loadTemplate());
    const [{ result: copied }] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: writeClipboard, args: [markdown] });
    if (!copied) return fail(tab.id, 'copy-failed');
    await flashBadge(tab.id, '✓', GREEN, 2500);
  } catch (e) {
    console.error(e);
    await chrome.scripting
      .executeScript({ target: { tabId: tab.id }, func: showToast, args: [`Unexpected error: ${e && e.message ? e.message : e}`] })
      .catch(() => {});
    await flashBadge(tab.id, '!', RED, 5000);
  }
});

// The icon is only active on episode pages (Spotify is a single-page app, so watch URL changes).
function syncAction(tabId, url) {
  return isEpisodeUrl(url) ? chrome.action.enable(tabId) : chrome.action.disable(tabId);
}

async function syncAllTabs() {
  await chrome.action.disable();
  for (const tab of await chrome.tabs.query({ url: 'https://open.spotify.com/*' })) syncAction(tab.id, tab.url);
}

chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.url || change.status) syncAction(tabId, tab.url);
});
chrome.runtime.onInstalled.addListener(syncAllTabs);
chrome.runtime.onStartup.addListener(syncAllTabs);
syncAllTabs();
