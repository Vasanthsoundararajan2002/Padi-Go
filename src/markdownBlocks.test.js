import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdownBlocks } from './markdownBlocks.js';

test('poem lines stay together as a stanza without markdown markers', () => {
  assert.deepEqual(parseMarkdownBlocks('### Life\n\n> Let me but live my life from year to year,\n> With forward face and unreluctant soul.'), [
    { type: 'heading', text: 'Life' },
    { type: 'poem', lines: ['Let me but live my life from year to year,', 'With forward face and unreluctant soul.'] },
  ]);
});

test('ordinary explanations and numbered steps still render as separate blocks', () => {
  assert.deepEqual(parseMarkdownBlocks('Meaning:\nLife is a journey.\n\n1. Read\n2. Think'), [
    { type: 'paragraph', lines: ['Meaning:', 'Life is a journey.'] },
    { type: 'ordered', lines: ['Read', 'Think'] },
  ]);
});

test('a stanza directly after a heading is still formatted as a poem', () => {
  assert.deepEqual(parseMarkdownBlocks('#### Stanza 1\n> First line\n> Second line\nExplanation follows.'), [
    { type: 'heading', text: 'Stanza 1' },
    { type: 'poem', lines: ['First line', 'Second line'] },
    { type: 'paragraph', lines: ['Explanation follows.'] },
  ]);
});
