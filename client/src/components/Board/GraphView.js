import React, { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTranslation } from '../../i18n';
import CardContextMenu from './CardContextMenu';
import { FiLayout, FiUsers } from 'react-icons/fi';
import * as d3 from 'd3-force';
import './GraphView.css';

const priorityColors = {
  critical: '#ed4245',
  high: '#f0b232',
  medium: '#fee75c',
  low: '#5865f2',
  none: '#4e5058'
};

function GraphView({ board, onCardClick, boardId, members, userRole, onUpdate }) {
  const { t } = useTranslation();
  const fgRef = useRef();
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [contextMenu, setContextMenu] = useState(null);
  const [graphMode, setGraphMode] = useState('columns'); // 'columns' | 'team'
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      const fg = fgRef.current;
      fg.d3Force('charge').strength(-40);
      fg.d3Force('link').distance(30).strength(1.2);
      fg.d3Force('x', d3.forceX(0).strength(0.2));
      fg.d3Force('y', d3.forceY(0).strength(0.2));
      fg.d3Force('collide', d3.forceCollide(25));
      fg.d3Force('center', d3.forceCenter(0, 0));
    }
  }, [graphMode]);

  const data = useMemo(() => {
    let rawNodes = [];
    let rawLinks = [];

    if (graphMode === 'columns') {
      // Режим колонок: Колонка -> Карточки
      board.columns.forEach(col => {
        rawNodes.push({ id: col._id, name: col.title, type: 'column', val: 14, color: '#5865f2' });
        col.cards.forEach(card => {
          rawNodes.push({ 
            id: card._id, 
            name: card.title, 
            type: 'card', 
            val: 8, 
            color: card.completed ? '#23a559' : '#b5bac1',
            priority: card.priority || 'none',
            data: card 
          });
          rawLinks.push({ source: col._id, target: card._id });
        });
      });
    } else {
      // Режим команды: Участник -> Карточки
      board.members.forEach(member => {
        const userId = member.user?._id;
        rawNodes.push({ 
          id: `u-${userId}`, 
          name: member.user?.displayName || member.user?.username, 
          type: 'user', 
          val: 12, 
          color: '#f470ad' 
        });

        board.columns.forEach(col => {
          col.cards.forEach(card => {
            const isAssigned = card.assignees?.some(p => (typeof p === 'string' ? p === userId : p._id === userId));
            if (isAssigned) {
              // Добавляем карточку только если она назначена
              if (!rawNodes.find(n => n.id === card._id)) {
                rawNodes.push({ 
                  id: card._id, 
                  name: card.title, 
                  type: 'card', 
                  val: 8, 
                  color: card.completed ? '#23a559' : '#b5bac1',
                  priority: card.priority || 'none',
                  data: card 
                });
              }
              rawLinks.push({ source: `u-${userId}`, target: card._id });
            }
          });
        });
      });
    }

    // Удаление изолированных вершин (без связей)
    const connectedNodeIds = new Set();
    rawLinks.forEach(link => {
      connectedNodeIds.add(typeof link.source === 'object' ? link.source.id : link.source);
      connectedNodeIds.add(typeof link.target === 'object' ? link.target.id : link.target);
    });

    const filteredNodes = rawNodes.filter(node => connectedNodeIds.has(node.id));

    return { nodes: filteredNodes, links: rawLinks };
  }, [board, graphMode]);

  const handleNodeRightClick = (node, event) => {
    if (node.type === 'card' && node.data) {
      setContextMenu({ card: node.data, x: event.clientX, y: event.clientY });
    }
  };

  return (
    <div className="graph-view-container" ref={containerRef}>
      <div className="graph-legend">
        <div className="legend-item"><span className="graph-dot col"></span> {t('board.column')}</div>
        <div className="legend-item"><span className="graph-dot card"></span> {t('board.card')}</div>
        <div className="legend-item"><span className="graph-dot user"></span> {t('board.members')}</div>
        
        <div className="graph-mode-toggle">
          <button 
            className={`graph-mode-btn ${graphMode === 'columns' ? 'active' : ''}`}
            onClick={() => setGraphMode('columns')}
            title="По колонкам"
          >
            <FiLayout />
          </button>
          <button 
            className={`graph-mode-btn ${graphMode === 'team' ? 'active' : ''}`}
            onClick={() => setGraphMode('team')}
            title="По команде"
          >
            <FiUsers />
          </button>
        </div>
      </div>

      <div className="graph-controls-hint">
        {t('common.zoom')}: Scroll • {t('common.pan')}: Drag • {t('common.actions')}: Right Click
      </div>
      
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#313338"
        nodeRelSize={4}
        linkColor={() => 'rgba(255, 255, 255, 0.08)'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const fontSize = 11 / globalScale;
          ctx.font = `${fontSize}px Inter, sans-serif`;

          // Priority Stroke
          if (node.type === 'card' && node.priority && node.priority !== 'none') {
            ctx.beginPath();
            ctx.arc(node.x, node.y, (node.val / 2) + (2 / globalScale), 0, 2 * Math.PI);
            ctx.strokeStyle = priorityColors[node.priority];
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }

          // Node Circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val / 2, 0, 2 * Math.PI);
          ctx.fillStyle = node.color;
          ctx.fill();

          if (globalScale > 3.5) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#dbdee1';
            ctx.fillText(node.name, node.x, node.y + (node.val / 2) + 6);
          }
        }}
        onNodeClick={(node) => node.type === 'card' && onCardClick(node.data)}
        onNodeRightClick={handleNodeRightClick}
        cooldownTicks={120}
        d3AlphaDecay={0.06}
        d3VelocityDecay={0.6}
      />

      {contextMenu && (
        <CardContextMenu
          card={contextMenu.card}
          boardId={boardId}
          columns={board.columns}
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

export default GraphView;
