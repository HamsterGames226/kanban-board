// Card component is inlined in Column.js for simplicity
// This file can be used for a standalone Card component if needed

import React from 'react';

function Card({ card, onClick }) {
  return (
    <div className="card" onClick={() => onClick(card)}>
      <div className={`card-priority-bar ${card.priority}`} />
      <div className="card-title">{card.title}</div>
    </div>
  );
}

export default Card;