// Fills a Markdown template with episode data.
// Syntax: {{name}} or {{name|filter:"arg"|filter2}}
// Filters: default:"text" (empty values), wikilink (wraps the value in an Obsidian [[link]])
// A line whose placeholders are all empty is dropped, so unknown values leave no empty rows.

const PLACEHOLDER = /\{\{\s*(\w+)((?:\s*\|\s*[^|}]+)*)\s*\}\}/g;

export const PLACEHOLDERS = ['title', 'show', 'showUrl', 'url', 'date', 'duration', 'transcript'];

// Characters that are not allowed inside an Obsidian note name become spaces.
export function wikilink(value) {
  if (value === '' || value == null) return '';
  return `[[${String(value).replace(/[[\]#^|\\/:]/g, ' ').replace(/\s+/g, ' ').trim()}]]`;
}

function applyFilter(value, filter) {
  const m = filter.trim().match(/^(\w+)(?::"([^"]*)")?$/);
  if (!m) return value;
  const [, name, arg] = m;
  if (name === 'wikilink') return wikilink(value);
  if (name === 'default') return value == null || value === '' ? arg || '' : value;
  return value;
}

function fill(line, data) {
  let used = 0;
  let filled = 0;
  const out = line.replace(PLACEHOLDER, (match, key, filters) => {
    if (!(key in data)) return match;
    let value = data[key];
    (filters.match(/\|[^|]+/g) || []).forEach((f) => {
      value = applyFilter(value, f.slice(1));
    });
    used += 1;
    const text = value == null ? '' : String(value);
    if (text !== '') filled += 1;
    return text;
  });
  return { out, drop: used > 0 && filled === 0 };
}

export function render(template, data) {
  const lines = [];
  for (const line of template.split('\n')) {
    const { out, drop } = fill(line, data);
    if (!drop) lines.push(out);
  }
  return lines.join('\n');
}
