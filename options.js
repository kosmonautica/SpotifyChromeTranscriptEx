import { PLACEHOLDERS } from './lib/template.js';
import { DEFAULT_TEMPLATE, loadTemplate } from './lib/defaults.js';

const $ = (id) => document.getElementById(id);

function flash(text) {
  $('status').textContent = text;
  setTimeout(() => ($('status').textContent = ''), 2000);
}

$('placeholders').innerHTML = PLACEHOLDERS.map((p) => `<code>{{${p}}}</code>`).join(' ');
loadTemplate().then((t) => ($('template').value = t));

$('save').addEventListener('click', async () => {
  await chrome.storage.sync.set({ template: $('template').value });
  flash('Saved');
});
$('reset').addEventListener('click', async () => {
  await chrome.storage.sync.remove('template');
  $('template').value = DEFAULT_TEMPLATE;
  flash('Reset');
});

$('close').addEventListener('click', async () => {
  const tab = await chrome.tabs.getCurrent();
  if (tab) chrome.tabs.remove(tab.id);
  else window.close();
});
