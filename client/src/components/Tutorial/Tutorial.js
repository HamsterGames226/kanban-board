import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { FiX, FiArrowRight, FiArrowLeft, FiLayout, FiPlus, FiUsers, FiMove, FiCheckSquare, FiSettings } from 'react-icons/fi';
import './Tutorial.css';

function Tutorial({ onComplete }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <FiLayout size={48} />,
      title: t('tutorial.welcome'),
      desc: t('tutorial.welcomeDesc'),
      color: '#5865f2',
    },
    {
      icon: <FiPlus size={48} />,
      title: t('tutorial.createBoard'),
      desc: t('tutorial.createBoardDesc'),
      color: '#57f287',
    },
    {
      icon: <FiMove size={48} />,
      title: t('tutorial.dragDrop'),
      desc: t('tutorial.dragDropDesc'),
      color: '#fee75c',
    },
    {
      icon: <FiCheckSquare size={48} />,
      title: t('tutorial.cards'),
      desc: t('tutorial.cardsDesc'),
      color: '#eb459e',
    },
    {
      icon: <FiUsers size={48} />,
      title: t('tutorial.collaborate'),
      desc: t('tutorial.collaborateDesc'),
      color: '#00a8fc',
    },
    {
      icon: <FiSettings size={48} />,
      title: t('tutorial.customize'),
      desc: t('tutorial.customizeDesc'),
      color: '#f0b232',
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleComplete = () => {
    localStorage.setItem('tutorial_completed', 'true');
    onComplete();
  };

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-modal">
        <button className="tutorial-skip" onClick={handleComplete}>
          <FiX />
        </button>

        {/* Progress dots */}
        <div className="tutorial-progress">
          {steps.map((_, i) => (
            <div key={i} className={`tutorial-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)} />
          ))}
        </div>

        {/* Content */}
        <div className="tutorial-content" key={step}>
          <div className="tutorial-icon" style={{ color: current.color, background: `${current.color}15` }}>
            {current.icon}
          </div>
          <h2>{current.title}</h2>
          <p>{current.desc}</p>
        </div>

        {/* Navigation */}
        <div className="tutorial-nav">
          {step > 0 && (
            <button className="tutorial-btn secondary" onClick={() => setStep(step - 1)}>
              <FiArrowLeft /> {t('common.back')}
            </button>
          )}
          <div style={{ flex: 1 }} />
          {isLast ? (
            <button className="tutorial-btn primary" onClick={handleComplete}>
              {t('tutorial.getStarted')} 🚀
            </button>
          ) : (
            <button className="tutorial-btn primary" onClick={() => setStep(step + 1)}>
              {t('common.next')} <FiArrowRight />
            </button>
          )}
        </div>

        <p className="tutorial-step-count">{step + 1} / {steps.length}</p>
      </div>
    </div>
  );
}

export default Tutorial;