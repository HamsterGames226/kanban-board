const express = require('express');
const Column = require('../models/Column');
const Board = require('../models/Board');
const Card = require('../models/Card');
const auth = require('../middleware/auth');
const router = express.Router();

async function checkRole(userId, boardId, minRole = 'member') {
  const board = await Board.findById(boardId);
  if (!board) return { allowed: false };
  const member = board.members.find(m => m.user.toString() === userId.toString());
  if (!member) return { allowed: false };
  const roles = ['viewer', 'member', 'admin', 'owner'];
  return { allowed: roles.indexOf(member.role) >= roles.indexOf(minRole), role: member.role };
}

// Create column (member+)
router.post('/', auth, async (req, res) => {
  try {
    const { title, boardId, color } = req.body;

    const roleCheck = await checkRole(req.user._id, boardId, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: 'Недостаточно прав' });

    const board = await Board.findById(boardId);
    const columnCount = await Column.countDocuments({ board: boardId });

    const column = new Column({
      title,
      board: boardId,
      order: columnCount,
      color: color || '#5865f2'
    });

    await column.save();
    board.columns.push(column._id);
    await board.save();

    global.io.in(`board:${boardId}`).emit('board:refresh', { boardId });
    res.status(201).json(column);
  } catch (error) {
    console.error('Column create error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Update column (member+)
router.put('/:id', auth, async (req, res) => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) return res.status(404).json({ message: 'Столбец не найден' });

    const roleCheck = await checkRole(req.user._id, column.board, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: 'Недостаточно прав' });

    const { title, color, order } = req.body;
    if (title) column.title = title;
    if (color) column.color = color;
    if (order !== undefined) column.order = order;
    await column.save();

    global.io.in(`board:${column.board}`).emit('board:refresh', { boardId: column.board });
    res.json(column);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Delete column (admin+)
router.delete('/:id', auth, async (req, res) => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) return res.status(404).json({ message: 'Столбец не найден' });

    const roleCheck = await checkRole(req.user._id, column.board, 'admin');
    if (!roleCheck.allowed) return res.status(403).json({ message: 'Только админ может удалять столбцы' });

    const board = await Board.findById(column.board);
    await Card.deleteMany({ column: column._id });
    board.columns = board.columns.filter(c => c.toString() !== column._id.toString());
    await board.save();

    const boardId = column.board;
    await Column.findByIdAndDelete(column._id);

    global.io.in(`board:${boardId}`).emit('board:refresh', { boardId });
    res.json({ message: 'Столбец удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Reorder columns (member+)
router.put('/reorder/:boardId', auth, async (req, res) => {
  try {
    const { columnOrder } = req.body;

    const roleCheck = await checkRole(req.user._id, req.params.boardId, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: 'Недостаточно прав' });

    for (let i = 0; i < columnOrder.length; i++) {
      await Column.findByIdAndUpdate(columnOrder[i], { order: i });
    }

    const board = await Board.findById(req.params.boardId);
    board.columns = columnOrder;
    await board.save();

    global.io.in(`board:${req.params.boardId}`).emit('board:refresh', { boardId: req.params.boardId });
    res.json({ message: 'Столбцы переупорядочены' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;