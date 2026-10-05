# Spotify Transcript Copy

Chrome extension (Manifest V3) that copies the transcript of a Spotify podcast episode to the clipboard as a Markdown note for Obsidian. It uses your own logged-in Spotify session in the browser; nothing is sent anywhere.

## Usage

1. Log in at [open.spotify.com](https://open.spotify.com) and open a podcast episode.
2. Switch to the **Transcript** tab of the episode.
3. Click the extension icon. A green check mark on the icon means the note is in your clipboard. Paste it into Obsidian.

The icon is only active on episode pages (`open.spotify.com/episode/...`); elsewhere it is greyed out.

If something is missing you get a red `!` on the icon and a short notice in the page:

| Situation | What happens |
| --- | --- |
| Not logged in | The tab is redirected to the official Spotify login and returns to the episode afterwards. Click the icon again after logging in. |
| Transcript tab not open | Notice to open the Transcript tab first. |
| Episode has no transcript | Notice that there is no transcript. |
| Transcript empty or still loading | Notice to try again in a moment. |

## Output

```markdown
---
title: "#211 Was ist die Campfire Method mit Jan Keck"
show: "[[Unboxing New Work]]"
url: https://open.spotify.com/episode/6abc123XYZ
show_url: https://open.spotify.com/show/33IjblLOWc7b4SLzWed02x
date: 2026-10-05
duration: "1 hr"
speakers:
  - "Sprecher*in 1"
  - "Sprecher*in 2"
tags:
  - podcast
  - transcript
---

# #211 Was ist die Campfire Method mit Jan Keck

**Show:** [[Unboxing New Work]]
**Date:** 2026-10-05
**Duration:** 1 hr
**URL:** [#211 Was ist die Campfire Method mit Jan Keck](https://open.spotify.com/episode/6abc123XYZ)

## Transcript

**Sprecher\*in 1**

Bevor es losgeht. herzlich willkommen zu Unboxing New Work ...

**Sprecher\*in 2**

Vielen Dank für die Einladung.
```

Properties that Spotify does not show are left out. The date is taken from the episode page; relative dates such as "Today" are converted to the current day. Spotify's transcript carries no timestamps, so none are exported. Speaker names are whatever Spotify shows ("Sprecher*in 1", ...).

## Install (unpacked)

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this folder.
3. Reload the extension on that page after code changes.

## Permissions and privacy

- `https://open.spotify.com/*`: read the episode page the icon is clicked on.
- `scripting`: inject the scraper into that page.
- `clipboardWrite`: write the note to the clipboard.

No tracking, no external requests, no data leaves your browser.

## Development

```
npm install   # test dependency (jsdom) only
npm test
```

No build step.
