// Turns the scraped episode data into an Obsidian note (YAML properties + wikilinks).

const MONTHS = {
  jan: 0, feb: 1, mar: 2, 'mär': 2, apr: 3, may: 4, mai: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11, dez: 11,
};

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Spotify shows "Today", "Yesterday", "Sep 29" or "Sep 29, 2023". Returns YYYY-MM-DD,
// or the raw text when it cannot be parsed.
export function normalizeDate(raw, now = new Date()) {
  const s = (raw || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const lower = s.toLowerCase();
  if (lower === 'today' || lower === 'heute') return isoDate(now);
  if (lower === 'yesterday' || lower === 'gestern') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return isoDate(d);
  }
  const m =
    s.match(/^([A-Za-zä]{3,})\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?$/) ||
    s.match(/^(\d{1,2})\.?\s+([A-Za-zä]{3,})\.?,?\s*(\d{4})?$/);
  if (m) {
    const [monthText, dayText] = /^\d/.test(m[1]) ? [m[2], m[1]] : [m[1], m[2]];
    const month = MONTHS[monthText.slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      const day = Number(dayText);
      let year = m[3] ? Number(m[3]) : now.getFullYear();
      if (!m[3] && new Date(year, month, day) > now) year -= 1;
      return isoDate(new Date(year, month, day));
    }
  }
  return s;
}

const yamlString = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const wikilink = (s) => `[[${String(s).replace(/[[\]#^|\\/:]/g, ' ').replace(/\s+/g, ' ').trim()}]]`;
const escapeEmphasis = (s) => String(s).replace(/([*_])/g, '\\$1');

export function buildMarkdown(ep, now = new Date()) {
  const date = normalizeDate(ep.releaseDate || ep.dateRaw, now);
  const speakers = [...new Set(ep.turns.map((t) => t.speaker).filter(Boolean))];

  const props = [`title: ${yamlString(ep.title)}`];
  if (ep.show) props.push(`show: ${yamlString(wikilink(ep.show))}`);
  props.push(`url: ${ep.url}`);
  if (ep.showUrl) props.push(`show_url: ${ep.showUrl}`);
  if (date) props.push(`date: ${yamlString(wikilink(date))}`);
  if (ep.duration) props.push(`duration: ${yamlString(ep.duration)}`);
  if (speakers.length) props.push('speakers:', ...speakers.map((s) => `  - ${yamlString(s)}`));
  props.push('tags:', '  - podcast', '  - transcript');

  const header = [`# Podcast-Episode: ${wikilink(ep.title)}`];
  if (ep.show) header.push(`## Podcast: ${wikilink(ep.show)}`);
  header.push(`## URL der Episode: [[${ep.url}]]`);
  if (date) header.push(`## ${wikilink(date)}`);
  if (ep.duration) header.push(`## Länge: ${wikilink(ep.duration)}`);

  const body = ep.turns.map((t) => {
    const label = t.speaker ? `**${escapeEmphasis(t.speaker)}**\n\n` : '';
    return `${label}${t.lines.join(' ')}`;
  });

  return [`---\n${props.join('\n')}\n---`, header.join('\n'), '## Transcript', body.join('\n\n')].join('\n\n') + '\n';
}
