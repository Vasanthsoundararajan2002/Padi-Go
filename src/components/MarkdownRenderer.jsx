import React from 'react';
import { parseMarkdownBlocks } from '../markdownBlocks.js';

/**
 * Renders AI response text with basic markdown-like formatting:
 * - **bold** text
 * - *italic* text
 * - Numbered lists (1. 2. 3.)
 * - Bullet lists (- or •)
 * - Code/formula blocks (`...`)
 * - Line breaks
 */
export default function MarkdownRenderer({ text }) {
  if (!text) return null;

  const blocks = parseMarkdownBlocks(text);

  return (
    <div className="markdown-content">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'heading') {
          return <h3 key={blockIndex}>{renderInline(block.text)}</h3>;
        }
        if (block.type === 'poem') {
          return (
            <blockquote key={blockIndex} className="poem-stanza">
              {block.lines.map((line, i) => <span key={i} className="poem-line">{renderInline(line)}</span>)}
            </blockquote>
          );
        }
        if (block.type === 'ordered') {
          return (
            <ol key={blockIndex} className="md-list">
              {block.lines.map((line, i) => <li key={i}>{renderInline(line)}</li>)}
            </ol>
          );
        }
        if (block.type === 'unordered') {
          return (
            <ul key={blockIndex} className="md-list">
              {block.lines.map((line, i) => <li key={i}>{renderInline(line)}</li>)}
            </ul>
          );
        }
        return (
          <p key={blockIndex}>
            {block.lines.map((line, i) => (
              <React.Fragment key={i}>
                {renderInline(line)}
                {i < block.lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Render inline formatting: bold, italic, code/formula.
 */
function renderInline(text) {
  if (!text) return null;

  // Split on formatting markers and build React elements
  const parts = [];
  let remaining = text;
  let key = 0;

  // Process **bold**, *italic*, and `code` patterns
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remaining)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      // `code`
      parts.push(<code key={key++} className="md-code">{match[4]}</code>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
