import React, { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { getDiagramUrl } from '../chat.js';

/**
 * Displays a textbook diagram with click-to-expand lightbox.
 */
export default function DiagramViewer({ diagram, subject, medium }) {
  const [expanded, setExpanded] = useState(false);
  const url = getDiagramUrl(subject, medium, diagram.id);

  return (
    <>
      <figure className="diagram-viewer" onClick={() => setExpanded(true)}>
        <img
          src={url}
          alt={diagram.caption || `Textbook diagram from page ${diagram.page_number}`}
          loading="lazy"
        />
        <figcaption>
          <ZoomIn size={14} />
          {diagram.caption
            ? diagram.caption
            : `Page ${diagram.page_number}`}
        </figcaption>
      </figure>

      {expanded && (
        <div className="diagram-lightbox" onClick={() => setExpanded(false)}>
          <button
            className="lightbox-close"
            type="button"
            aria-label="Close"
            onClick={() => setExpanded(false)}
          >
            <X size={22} />
          </button>
          <img
            src={url}
            alt={diagram.caption || `Textbook diagram from page ${diagram.page_number}`}
          />
          {diagram.caption && <p>{diagram.caption}</p>}
        </div>
      )}
    </>
  );
}
