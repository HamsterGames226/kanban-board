import React from 'react';
import { useTranslation } from '../../i18n';
import { useHotkeys } from './HotkeyProvider';
import { FiX } from 'react-icons/fi';
import './Hotkeys.css';

function HotkeyHelp() {
  const { t } = useTranslation();
  const { showHelp, setShowHelp } = useHotkeys();

  if (!showHelp) return null;

  const sections = [
    {
      title: t('hotkeys.navigation'),
      keys: [
        { combo: 'H', desc: t('hotkeys.goHome') },
        { combo: 'P', desc: t('hotkeys.goProfile') },
        { combo: 'Esc', desc: t('hotkeys.closeModal') },
      ]
    },
    {
      title: t('hotkeys.board'),
      keys: [
        { combo: 'N', desc: t('hotkeys.newCard') },
        { combo: 'Shift + N', desc: t('hotkeys.newColumn') },
        { combo: 'M', desc: t('hotkeys.toggleMembers') },
        { combo: 'I', desc: t('hotkeys.invite') },
        { combo: 'G', desc: t('hotkeys.boardSettings') },
      ]
    },
    {
      title: t('hotkeys.general'),
      keys: [
        { combo: '?', desc: t('hotkeys.showHelp') },
        { combo: 'Ctrl + Click', desc: t('hotkeys.openNewTab') },
      ]
    },
    {
      title: t('hotkeys.views'),
      keys: [
        { combo: '1', desc: t('hotkeys.viewKanban') },
        { combo: '2', desc: t('hotkeys.viewCalendar') },
        { combo: '3', desc: t('hotkeys.viewGraph') },
      ]
    }
  ];

  return (
    <div className="hotkey-overlay" onClick={() => setShowHelp(false)}>
      <div className="hotkey-modal" onClick={e => e.stopPropagation()}>
        <div className="hotkey-header">
          <h2>{t('hotkeys.title')}</h2>
          <button className="hotkey-close" onClick={() => setShowHelp(false)}>
            <FiX />
          </button>
        </div>

        <div className="hotkey-grid">
          {sections.map((section, i) => (
            <div key={i} className="hotkey-section">
              <h3>{section.title}</h3>
              {section.keys.map((k, j) => (
                <div key={j} className="hotkey-row">
                  <span className="hotkey-desc">{k.desc}</span>
                  <div className="hotkey-combo">
                    {k.combo.split(' + ').map((key, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="hotkey-plus">+</span>}
                        <kbd className="hotkey-key">{key}</kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HotkeyHelp;