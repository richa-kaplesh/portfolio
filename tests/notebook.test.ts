import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanLog, renderNotebook } from '../src/lib/notebook.ts';
import { sample } from './make-sample.ts';

const { html, headings } = await renderNotebook(JSON.stringify(sample), 'sample');

test('headings move down one level and get unique ids', () => {
  assert.deepEqual(headings, [
    { id: 'intro', text: 'Intro', depth: 2 },
    { id: 'setup', text: 'Setup', depth: 3 },
    { id: 'setup-2', text: 'Setup', depth: 3 },
  ]);
  assert.match(html, /<h3 id="nb-setup-2">Setup<\/h3>/);
});

test('math renders, and prices and code stay as text', () => {
  assert.equal(html.match(/class="katex-display"/g)?.length, 2);
  assert.equal(html.match(/class="katex"/g)?.length, 3);
  assert.ok(html.includes('$5 or $10'));
  assert.ok(html.includes('<code>$not math$</code>'));
  assert.ok(!html.includes('katex-error'));
  assert.ok(!html.includes('data-math'));
});

test('scripts, styles and event handlers are removed', () => {
  assert.doesNotMatch(html, /<script|onerror|onclick|javascript:|td\{color/);
});

test('the Colab badge cell and empty cells are dropped', () => {
  assert.ok(!html.includes('colab.research'));
  assert.equal(html.match(/class="nb-cell"/g)?.length, 6);
});

test('long output is cut, with the rest behind Show more', () => {
  assert.ok(html.includes('Show more (188 lines)'));
});

test('tables, images and attachments render', () => {
  assert.match(html, /<table><tr><th>col<\/th>|<table><tbody>/);
  assert.equal(html.match(/<img src="data:image\/png;base64,/g)?.length, 2);
});

test('an interactive output falls back to its text', () => {
  assert.ok(html.includes('Figure()'));
});

test('errors show their message without terminal colors', () => {
  assert.ok(html.includes('<summary>ModuleNotFoundError: No module named'));
  assert.ok(!html.includes('\u001b'));
});

test('cleanLog keeps the final state of a progress bar', () => {
  assert.equal(cleanLog('  10%\r  50%\r 100%\r\n'), ' 100%');
});

test('a broken notebook fails with its name', async () => {
  await assert.rejects(renderNotebook('{', 'broken'), /broken\.ipynb is not valid JSON/);
  await assert.rejects(renderNotebook('{"nbformat":3}', 'old'), /old\.ipynb must use/);
});
