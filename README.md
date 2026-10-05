# Spotify Transcript Copy

Chrome extension (Manifest V3) that copies the transcript of a Spotify podcast episode to the clipboard as a Markdown note for Obsidian. It uses your own logged-in Spotify session in the browser; nothing is sent anywhere.

## Usage

1. Log in at [open.spotify.com](https://open.spotify.com) and open a podcast episode.
2. Switch to the **Transcript** tab of the episode.
3. Click the extension icon. A green check mark on the icon means the note is in your clipboard. Paste it into Obsidian.

The icon is only active on episode pages (`open.spotify.com/episode/...`); elsewhere it is greyed out.

If something is missing you get a red `!` on the icon and a short notice at the top right of the page:

| Situation | What happens |
| --- | --- |
| Not logged in | The tab is redirected to the official Spotify login and returns to the episode afterwards. Click the icon again after logging in. |
| Transcript tab not open | Notice at the top right: open a podcast episode page on Spotify and make the Transcript tab visible. |
| Episode has no transcript | Notice that there is no transcript. |
| Transcript empty or still loading | Notice to try again in a moment. |
| Unexpected error | Notice with the error message. |

## Output

```markdown
# Podcast-Episode: [[211 Was ist die Campfire Method mit Jan Keck]]
## Podcast: [[Unboxing New Work]]
## URL der Episode: [[https://open.spotify.com/episode/6abc123XYZ]]
## [[2026-10-05]]
## Länge: [[1 hr]]

## Transcript

**Sprecher\*in 1**

Bevor es losgeht. herzlich willkommen zu Unboxing New Work ...

**Sprecher\*in 2**

Vielen Dank für die Einladung.
```

Lines whose value Spotify does not show are left out. There is no YAML frontmatter; the note starts with the header. Title, podcast, URL, date and length are written as wikilinks (the date in daily-note style); characters Obsidian does not allow in links (such as `#`) are removed from the title and the podcast name. The date is taken from the episode page; relative dates such as "Today" are converted to the current day. Spotify's transcript carries no timestamps, so none are exported. Only the Transcript tab is exported; the Chapters and Description tabs are ignored, and chapter headings that Spotify shows inside the transcript are not exported as speakers (matched by title when the Chapters panel is in the page, otherwise by a heuristic: a unique label of four or more words while other speakers repeat). Speaker names are whatever Spotify shows ("Sprecher*in 1", ...).

## Install (unpacked)

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Reload the extension on that page after code changes.

## Permissions and privacy

- `https://open.spotify.com/*`: read the episode page the icon is clicked on.
- `scripting`: inject the scraper into that page.
- `clipboardWrite`: write the note to the clipboard.

No tracking, no external requests, no data leaves your browser.

## Copyright and terms of use

This is an independent, unofficial tool. It is not affiliated with, endorsed by or sponsored by Spotify AB, and "Spotify" is a trademark of its owner.

Podcast episodes, their transcripts and the accompanying metadata may be protected by copyright and related rights held by Spotify, the podcast producers, the speakers or other third parties. The extension grants no rights to any such content. It only reads the page you are looking at in your own browser, with your own account, and places the text on your clipboard on your explicit click. It does not store, upload, publish or distribute anything.

**Each user is solely responsible for how the copied transcript is used.** This includes complying with applicable copyright law (for example, in Germany the limits on private copying in section 53 of the Urheberrechtsgesetz, which does not cover commercial purposes, and the rules on text and data mining in section 44b, which are subject to a rights holder's reservation of rights) and with the terms of the services involved, in particular the Spotify Terms and Conditions of Use. As of the last review of this note, those terms grant only a limited, personal, non-commercial right to use the service and its content, and prohibit copying, reproducing or redistributing content beyond what is expressly permitted, as well as scraping or collecting information by automated means. Please read the current terms yourself, as they can change, and check whether your intended use is permitted. Do not publish or share transcripts without the permission of the rights holders, and do not use them for commercial purposes, for training machine learning models or for bulk collection.

The software is provided "as is", without warranty of any kind. To the extent permitted by law, the author accepts no liability for any use of the extension or of content copied with it. This note is general information, not legal advice.

## Development

```
npm install   # test dependency (jsdom) only
npm test
```

No build step.
