export function parseMarkdownBlocks(text) {
  const blocks = [];
  let current = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) { current = null; continue; }
    if (/^#{1,6}\s/.test(line)) {
      blocks.push({ type: 'heading', text: line.replace(/^#{1,6}\s+/, '') });
      current = null;
      continue;
    }
    const type = /^>\s?/.test(line) ? 'poem'
      : /^\d+[.)]\s/.test(line) ? 'ordered'
        : /^[-•*]\s/.test(line) ? 'unordered' : 'paragraph';
    if (!current || current.type !== type) {
      current = { type, lines: [] };
      blocks.push(current);
    }
    current.lines.push(type === 'poem' ? line.replace(/^>\s?/, '')
      : type === 'ordered' ? line.replace(/^\d+[.)]\s*/, '')
        : type === 'unordered' ? line.replace(/^[-•*]\s*/, '') : line);
  }
  return blocks;
}
