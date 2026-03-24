import React, { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import CardContextMenu from './CardContextMenu';
import { renderAvatar } from '../../utils/avatar';
import './CalendarView.css';

const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const priorityColors = {
  critical: '#ed4245',
  high: '#f0b232',
  medium: '#fee75c',
  low: '#5865f2',
  none: 'transparent'
};

function CalendarView({ columns, onCardClick, savedLabels, boardId, members, userRole, onUpdate }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [contextMenu, setContextMenu] = useState(null);

  const allCards = useMemo(() => {
    const cards = [];
    columns.forEach(col => {
      col.cards.forEach(card => {
        if (card.dueDate) {
          cards.push({ ...card, columnName: col.title });
        }
      });
    });
    return cards;
  }, [columns]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        currentMonth: false,
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      });
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        currentMonth: true,
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        currentMonth: false,
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      });
    }

    return days;
  }, [year, month]);

  const changeMonth = (offset) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const getCardsForDate = (date) => {
    const dStr = date.toISOString().split('T')[0];
    return allCards.filter(c => c.dueDate.split('T')[0] === dStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const handleContextMenu = (e, card) => {
    e.preventDefault();
    setContextMenu({ card, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="calendar-view-container">
      <div className="calendar-header">
        <div className="calendar-current-month">
          {months[month]} {year}
        </div>
        <div className="calendar-nav">
          <button className="cal-nav-btn" onClick={() => changeMonth(-1)} title="Предыдущий месяц"><FiChevronLeft /></button>
          <button className="cal-nav-btn today" onClick={() => setViewDate(new Date())}>Сегодня</button>
          <button className="cal-nav-btn" onClick={() => changeMonth(1)} title="Следующий месяц"><FiChevronRight /></button>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-day-names">
          {daysOfWeek.map(d => <div key={d} className="calendar-day-name">{d}</div>)}
        </div>
        <div className="calendar-cells">
          {calendarDays.map((day, idx) => {
            const dateCards = getCardsForDate(day.date);
            return (
              <div key={idx} className={`calendar-cell ${day.currentMonth ? '' : 'other-month'} ${isToday(day.date) ? 'today' : ''} ${day.isWeekend ? 'weekend' : ''}`}>
                <div className="calendar-day-num">{day.date.getDate()}</div>
                <div className="calendar-cell-content">
                  {dateCards.map(card => (
                    <div 
                      key={card._id} 
                      className="calendar-card-item" 
                      onClick={() => onCardClick(card)}
                      onContextMenu={(e) => handleContextMenu(e, card)}
                      style={{ borderLeft: card.priority !== 'none' ? `3px solid ${priorityColors[card.priority]}` : 'none' }}
                    >
                      <div className="cal-card-labels">
                        {card.labels?.map(id => {
                          const sl = savedLabels?.find(l => l._id === id);
                          if (!sl) return null;
                          return <div key={id} className="cal-card-label-bar" style={{ background: sl.color }} title={sl.name} />;
                        })}
                      </div>
                      <div className="cal-card-main">
                        <span className="cal-card-title">{card.title}</span>
                        <div className="cal-card-assignees">
                          {card.assignees?.slice(0, 3).map(u => (
                            <div key={u._id} className="cal-card-avatar">
                              {renderAvatar(u, 18)}
                            </div>
                          ))}
                          {card.assignees?.length > 3 && <div className="cal-card-avatar more">+{card.assignees.length - 3}</div>}
                        </div>
                      </div>
                      <div className="cal-card-meta">
                        <span className="cal-card-col-info">{card.columnName}</span>
                        {card.completed && <FiCheck className="cal-card-done" size={12} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {contextMenu && (
        <CardContextMenu
          card={contextMenu.card}
          boardId={boardId}
          columns={columns}
          members={members}
          userRole={userRole}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onUpdate={onUpdate}
          onOpenCard={onCardClick}
        />
      )}
    </div>
  );
}

export default CalendarView;
