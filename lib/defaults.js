export const DEFAULT_TEMPLATE = `# Podcast-Episode: {{title|wikilink}}
## Podcast: {{show|wikilink}}
## URL der Episode: [[{{url}}]]
## {{date|wikilink}}
## Länge: {{duration|wikilink}}

## Transcript

{{transcript}}
`;

// Reads the user's template from the settings, falling back to the default.
export async function loadTemplate() {
  const { template } = await chrome.storage.sync.get('template');
  return template || DEFAULT_TEMPLATE;
}
