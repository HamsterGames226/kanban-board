import React, { useState, useRef } from 'react';
import { useTranslation } from '../../i18n';
import MarkdownRenderer from './MarkdownRenderer';
import { FiBold, FiItalic, FiList, FiCode, FiLink, FiMinus, FiImage } from 'react-icons/fi';
import './Markdown.css';

function MarkdownEditor({ value, onChange, placeholder }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('write'); // 'write' | 'preview'
  const textareaRef = useRef(null);

  const insertMarkdown = (before, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + selected.length;
    }, 10);
  };

  const tools = [
    { icon: <FiBold size={14} />, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: <FiItalic size={14} />, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { type: 'divider' },
    { icon: <FiCode size={14} />, action: () => insertMarkdown('`', '`'), title: 'Code' },
    { icon: <FiLink size={14} />, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { icon: <FiImage size={14} />, action: () => insertMarkdown('![alt](', ')'), title: 'Image' },
    { type: 'divider' },
    { icon: <FiList size={14} />, action: () => insertMarkdown('- '), title: 'List' },
    { icon: <span style={{ fontSize: 12, fontWeight: 700 }}>1.</span>, action: () => insertMarkdown('1. '), title: 'Numbered List' },
    { icon: <FiMinus size={14} />, action: () => insertMarkdown('\n---\n'), title: 'Divider' },
    { type: 'divider' },
    { icon: <span style={{ fontSize: 12, fontWeight: 700 }}>H1</span>, action: () => insertMarkdown('# '), title: 'Heading 1' },
    { icon: <span style={{ fontSize: 12, fontWeight: 700 }}>H2</span>, action: () => insertMarkdown('## '), title: 'Heading 2' },
    { icon: <span style={{ fontSize: 11 }}>{">"}</span>, action: () => insertMarkdown('> '), title: 'Quote' },
  ];

  return (
    <div className="md-editor-wrap">
      <div className="md-tabs">
        <button className={`md-tab ${tab === 'write' ? 'active' : ''}`}
          onClick={() => setTab('write')}>
          {t('markdown.write')}
        </button>
        <button className={`md-tab ${tab === 'preview' ? 'active' : ''}`}
          onClick={() => setTab('preview')}>
          {t('markdown.preview')}
        </button>
      </div>

      {tab === 'write' && (
        <>
          <div className="md-toolbar">
            {tools.map((tool, i) =>
              tool.type === 'divider' ? (
                <div key={i} className="md-toolbar-divider" />
              ) : (
                <button key={i} className="md-toolbar-btn" onClick={tool.action} title={tool.title}>
                  {tool.icon}
                </button>
              )
            )}
          </div>
          <textarea
            ref={textareaRef}
            className="card-modal-desc"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ borderRadius: '0 0 4px 4px', minHeight: 120 }}
          />
        </>
      )}

      {tab === 'preview' && (
        <div style={{
          padding: 12, background: 'var(--input-background)',
          borderRadius: 'var(--radius-sm)', minHeight: 120,
          border: '1px solid var(--border-subtle)'
        }}>
          {value ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{placeholder}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MarkdownEditor;