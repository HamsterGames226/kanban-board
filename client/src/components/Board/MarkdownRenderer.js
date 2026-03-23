import React from 'react';
import ReactMarkdown from 'react-markdown';
import './Markdown.css';

function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="md-content">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          code: ({ inline, children }) => {
            if (inline) return <code className="md-inline-code">{children}</code>;
            return <pre className="md-code-block"><code>{children}</code></pre>;
          },
          ul: ({ children }) => <ul className="md-list">{children}</ul>,
          ol: ({ children }) => <ol className="md-list">{children}</ol>,
          blockquote: ({ children }) => <blockquote className="md-quote">{children}</blockquote>,
          img: ({ src, alt }) => <img src={src} alt={alt} className="md-image" />,
          table: ({ children }) => <div className="md-table-wrap"><table>{children}</table></div>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;