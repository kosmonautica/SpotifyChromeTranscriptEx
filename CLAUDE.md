# SpotifyChromeTranscriptEx

Chrome extension (Manifest V3) that copies the transcript of a Spotify podcast episode to the clipboard as an Obsidian-ready Markdown note. The user pastes it manually into Obsidian, so there is no Obsidian integration. The project is at an early stage; update this file whenever a structural decision is made.

## Workflow

1. The user is logged in to Spotify in Chrome and opens a podcast episode on `open.spotify.com`.
2. The user switches to the "Transcript" tab of the episode page by hand (automatic tab switching is a possible later step).
3. The user clicks the extension icon. There is no popup: a click copies the note right away.
4. On success the icon shows a green check mark badge for a moment. On a problem it shows a red `!` badge and a short notice in the page.

Rules for the icon and its messages:

- The icon is only enabled on episode pages (`https://open.spotify.com/episode/...`, also with an `intl-xx` prefix); everywhere else Chrome greys it out. Spotify is a single-page app, so `background.js` re-checks the URL on every tab update.
- Not logged in: the tab is redirected to the official login (`accounts.spotify.com/login?continue=<episode url>`). Login state comes from `isAnonymous` in the base64 JSON of `script#appServerConfig`, with the user widget as fallback.
- Transcript tab not selected: notice "open the Transcript tab first". No transcript tab or a disabled one: "no transcript". Empty panel: "empty or still loading".

## Output format

Obsidian note: YAML properties (`title`, `show` as wikilink, `url`, `show_url`, `date` as `[[YYYY-MM-DD]]` wikilink, `duration`, `speakers`, `tags`), then a heading, a short info block with the show and the date as `[[wikilinks]]`, and `## Transcript` with one block per speaker turn (bold speaker, then the lines joined into one paragraph). Properties that are unknown are omitted. Spotify's transcript DOM carries no timestamps, so none are exported.

## Architecture

Plain JavaScript, no build step, no runtime dependencies. Do not introduce a bundler or framework without agreement. `jsdom` is a dev dependency used only by the tests.

- `manifest.json`: MV3; permissions `scripting` and `clipboardWrite`; host access only to `https://open.spotify.com/*`. No popup, no `activeTab`.
- `background.js`: service worker (ES module). Handles the icon click, enables/disables the icon per tab, runs `scraper.js` in the page, builds the note, writes it to the clipboard (injected function with `execCommand('copy')`, `navigator.clipboard` as fallback) and shows badge/toast feedback.
- `scraper.js`: injected into the page with `chrome.scripting.executeScript` (`files`). Must stay a self-contained classic script whose last expression is the result. Returns `{status}` for problems (`login-required`, `not-episode`, `no-transcript`, `open-transcript-tab`, `empty`) or `{status: 'ok', ...episode}`. It uses stable hooks only (`data-testid`, `data-encore-id`, `#transcript-tab`, `#transcript-panel`, `dir="auto"`, the bold "marginal" text class); the hashed CSS class names change with every Spotify build and must not be used.
- `lib/markdown.js`: `buildMarkdown` and `normalizeDate` (handles "Today", "Yesterday", "Sep 29", "Sep 29, 2023", a few German forms).
- `lib/urls.js`: episode URL detection, canonical URL, login URL.
- `icons/`: `icon.svg` is the source; `icon-16/32/48/128.png` are rendered from it. Re-render the PNGs after changing the SVG (headless Chromium screenshot of the SVG at 512 px, then downscale with ImageMagick).
- `test/`: `node --test`; the fixture `test/fixtures/episode-with-transcript.html` is a trimmed real episode page (logged in, Transcript tab selected).

Assumption to re-check when Spotify changes its UI: the whole transcript is rendered in the DOM at once (true for a one hour episode). If long episodes turn out to be virtualized, the scraper has to scroll the panel and collect the lines.

## Standing rules

- All written output is in English: code, identifiers, comments, UI strings, commit messages, PR text, README and this file. The chat with the user is in German.
- Always keep `README.md` and `CLAUDE.md` up to date on your own, without being asked, whenever a change affects them. Both stay in English.
- Never mention Claude, AI, or any assistant in any text: not in commit messages, PR descriptions, branch names, code, comments or docs. No `Co-Authored-By` or session trailers.

## Conventions

- Manifest V3 (service worker instead of background page, no remotely hosted code).
- Request the fewest possible permissions in `manifest.json`; restrict host access to `open.spotify.com`.
- No tracking and no external requests. The extension only reads the page the user is on and talks to the clipboard.
- Keep changes small and follow the existing code style.

## Commands

- `npm install`: installs the test dependency (once).
- `npm test`: run the unit tests (Node 20+).

## Testing locally

1. Open `chrome://extensions` and enable Developer mode.
2. Click "Load unpacked" and select the project folder.
3. Reload the extension there after code changes.

Real-browser check without a Spotify account: launch Playwright's Chromium (`--headless=new`, `--load-extension=<folder>`), serve `test/fixtures/episode-with-transcript.html` for `https://open.spotify.com/**` via request routing, and trigger the click with `serviceWorker.evaluate(() => chrome.action.onClicked.dispatch(tab))`. Then read the clipboard and the badge text. Spotify itself cannot be tested headless because it needs a logged-in session.

## Git

- Develop on a feature branch, not directly on `main`.
- After pushing, open a pull request and merge it into `main` right away (squash merge, clean commit title). The user wants every finished change on `main` immediately, without asking again.
- Start each new change from the latest `main`; the work branch is reset to `origin/main` for that (force-with-lease is fine, its old content is already merged).
- Keep `README.md` in sync with the behaviour, the output format and the permissions.
