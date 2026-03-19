const express = require('express');
const Card = require('../models/Card');
const Column = require('../models/Column');
const Board = require('../models/Board');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper: проверка роли
async function checkRole(userId, boardId, minRole = 'member') {
  const board = await Board.findById(boardId);
  if (!board) return { allowed: false, message: 'Доска не найдена' };

  const member = board.members.find(m => m.user.toString() === userId.toString());
  if (!member) return { allowed: false, message: 'Нет доступа' };

  const roles = ['viewer', 'member', 'admin', 'owner'];
  const userLevel = roles.indexOf(member.role);
  const requiredLevel = roles.indexOf(minRole);

  if (userLevel < requiredLevel) {
    return { allowed: false, message: 'Недостаточно прав' };
  }

  return { allowed: true, role: member.role };
}

// Create card (member+)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, columnId, boardId, priority } = req.body;

    const roleCheck = await checkRole(req.user._id, boardId, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const column = await Column.findById(columnId);
    if (!column) return res.status(404).json({ message: 'Столбец не найден' });

    const cardCount = await Card.countDocuments({ column: columnId });

    const card = new Card({
      title,
      description: description || '',
      column: columnId,
      board: boardId,
      priority: priority || 'none',
      order: cardCount,
      createdBy: req.user._id
    });

    await card.save();
    column.cards.push(card._id);
    await column.save();

    const populatedCard = await Card.findById(card._id)
      .populate('assignees', 'username avatar customAvatar displayName')
      .populate('createdBy', 'username avatar customAvatar displayName');

    global.io.in(`board:${boardId}`).emit('board:refresh', { boardId });
    res.status(201).json(populatedCard);
  } catch (error) {
    console.error('Card create error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Update card (member+)
router.put('/:id', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Карточка не найдена' });

    const roleCheck = await checkRole(req.user._id, card.board, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const allowedFields = ['title', 'description', 'priority', 'labels', 'assignees', 'dueDate', 'order', 'checklist'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) card[field] = req.body[field];
    });

    await card.save();

    const populatedCard = await Card.findById(card._id)
      .populate('assignees', 'username avatar customAvatar displayName')
      .populate('createdBy', 'username avatar customAvatar displayName')
      .populate('comments.user', 'username avatar customAvatar displayName');

    global.io.in(`board:${card.board}`).emit('board:refresh', { boardId: card.board });
    res.json(populatedCard);
  } catch (error) {
    console.error('Card update error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Delete card (member+)
router.delete('/:id', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Карточка не найдена' });

    const roleCheck = await checkRole(req.user._id, card.board, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const column = await Column.findById(card.column);
    if (column) {
      column.cards = column.cards.filter(c => c.toString() !== card._id.toString());
      await column.save();
    }

    const boardId = card.board;
    await Card.findByIdAndDelete(card._id);

    global.io.in(`board:${boardId}`).emit('board:refresh', { boardId });
    res.json({ message: 'Карточка удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Move card (member+)
router.put('/:id/move', auth, async (req, res) => {
  try {
    const { sourceColumnId, destColumnId, newOrder } = req.body;
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Карточка не найдена' });

    const roleCheck = await checkRole(req.user._id, card.board, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const sourceColumn = await Column.findById(sourceColumnId);
    if (sourceColumn) {
      sourceColumn.cards = sourceColumn.cards.filter(c => c.toString() !== card._id.toString());
      await sourceColumn.save();
    }

    const destColumn = await Column.findById(destColumnId);
    if (destColumn) {
      destColumn.cards.splice(newOrder, 0, card._id);
      await destColumn.save();
    }

    card.column = destColumnId;
    card.order = newOrder;
    await card.save();

    if (destColumn) {
      for (let i = 0; i < destColumn.cards.length; i++) {
        await Card.findByIdAndUpdate(destColumn.cards[i], { order: i });
      }
    }

    global.io.in(`board:${card.board}`).emit('board:refresh', { boardId: card.board });
    res.json({ message: 'Карточка перемещена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Add comment (viewer может комментировать)
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Карточка не найдена' });

    // Даже viewer может комментировать
    const board = await Board.findById(card.board);
    const isMember = board.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Нет доступа' });

    card.comments.push({ user: req.user._id, text: req.body.text });
    await card.save();

    const populatedCard = await Card.findById(card._id)
      .populate('assignees', 'username avatar customAvatar displayName')
      .populate('createdBy', 'username avatar customAvatar displayName')
      .populate('comments.user', 'username avatar customAvatar displayName');

    global.io.in(`board:${card.board}`).emit('board:refresh', { boardId: card.board });
    res.json(populatedCard);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;