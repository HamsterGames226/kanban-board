const express = require('express');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper: получить роль пользователя на доске
async function getUserRole(userId, board) {
  const member = board.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
}

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

  return { allowed: true, role: member.role, board };
}

// Get all boards for current user
router.get('/', auth, async (req, res) => {
  try {
    const boards = await Board.find({
      'members.user': req.user._id
    })
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName')
      .sort({ updatedAt: -1 });

    res.json(boards);
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Get single board with columns and cards
router.get('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName');

    if (!board) return res.status(404).json({ message: 'Доска не найдена' });

    const isMember = board.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Нет доступа' });

    const columns = await Column.find({ board: board._id })
      .sort({ order: 1 });

    const columnIds = columns.map(c => c._id);
    const cards = await Card.find({ column: { $in: columnIds } })
      .populate('assignees', 'username avatar customAvatar displayName')
      .populate('createdBy', 'username avatar customAvatar displayName')
      .populate('comments.user', 'username avatar customAvatar displayName')
      .sort({ order: 1 });

    const columnsWithCards = columns.map(col => ({
      ...col.toObject(),
      cards: cards.filter(card => card.column.toString() === col._id.toString())
    }));

    res.json({ ...board.toObject(), columns: columnsWithCards });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Create board
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, background } = req.body;

    const board = new Board({
      title,
      description: description || '',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
      background: background || { type: 'color', value: '#2f3136' }
    });

    await board.save();

    const populated = await Board.findById(board._id)
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Update board (admin+)
router.put('/:id', auth, async (req, res) => {
  try {
    const roleCheck = await checkRole(req.user._id, req.params.id, 'admin');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const board = roleCheck.board;
    const { title, description, background, savedLabels } = req.body;

    if (title !== undefined) board.title = title;
    if (description !== undefined) board.description = description;
    if (background !== undefined) board.background = background;
    if (savedLabels !== undefined) board.savedLabels = savedLabels;

    await board.save();

    const populated = await Board.findById(board._id)
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName');

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });
    res.json(populated);
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Delete board (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Доска не найдена' });

    const role = await getUserRole(req.user._id, board);
    if (role !== 'owner') return res.status(403).json({ message: 'Только владелец может удалить доску' });

    await Card.deleteMany({ board: board._id });
    await Column.deleteMany({ board: board._id });
    await Board.findByIdAndDelete(board._id);

    global.io.in(`board:${board._id}`).emit('board:deleted', { boardId: board._id });
    res.json({ message: 'Доска удалена' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Add member to board (admin+)
router.post('/:id/members', auth, async (req, res) => {
  try {
    const roleCheck = await checkRole(req.user._id, req.params.id, 'admin');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const board = roleCheck.board;
    const { userId, role } = req.body;

    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ message: 'Пользователь не найден' });

    const alreadyMember = board.members.some(m => m.user.toString() === userId);
    if (alreadyMember) return res.status(400).json({ message: 'Пользователь уже является участником' });

    board.members.push({ user: userId, role: role || 'member' });
    await board.save();

    const populated = await Board.findById(board._id)
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName');

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });
    res.json(populated);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Update member role (admin+)
router.put('/:id/members/:userId', auth, async (req, res) => {
  try {
    const roleCheck = await checkRole(req.user._id, req.params.id, 'admin');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const board = roleCheck.board;
    const member = board.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Участник не найден' });

    if (member.role === 'owner') return res.status(403).json({ message: 'Нельзя изменить роль владельца' });

    member.role = req.body.role;
    await board.save();

    const populated = await Board.findById(board._id)
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName');

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });
    res.json(populated);
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Remove member from board (admin+)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const roleCheck = await checkRole(req.user._id, req.params.id, 'admin');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const board = roleCheck.board;
    const memberToRemove = board.members.find(m => m.user.toString() === req.params.userId);
    if (!memberToRemove) return res.status(404).json({ message: 'Участник не найден' });

    if (memberToRemove.role === 'owner') return res.status(403).json({ message: 'Нельзя удалить владельца' });

    board.members = board.members.filter(m => m.user.toString() !== req.params.userId);
    await board.save();

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });
    res.json({ message: 'Участник удалён' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Generate invite code (admin+)
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const roleCheck = await checkRole(req.user._id, req.params.id, 'admin');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const board = roleCheck.board;
    board.generateInviteCode();
    await board.save();

    res.json({ inviteCode: board.inviteCode });
  } catch (error) {
    console.error('Generate invite error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Join board by invite code
router.post('/join/:code', auth, async (req, res) => {
  try {
    const board = await Board.findOne({ inviteCode: req.params.code });
    if (!board) return res.status(404).json({ message: 'Неверный код приглашения' });

    const alreadyMember = board.members.some(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'Вы уже участник этой доски' });

    board.members.push({ user: req.user._id, role: 'member' });
    await board.save();

    const populated = await Board.findById(board._id)
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName');

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });
    res.json(populated);
  } catch (error) {
    console.error('Join board error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Reorder columns (member+)
router.put('/:id/columns/reorder', auth, async (req, res) => {
  try {
    const roleCheck = await checkRole(req.user._id, req.params.id, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const { columnOrder } = req.body;

    for (let i = 0; i < columnOrder.length; i++) {
      await Column.findByIdAndUpdate(columnOrder[i], { order: i });
    }

    const board = roleCheck.board;
    board.columns = columnOrder;
    await board.save();

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });
    res.json({ message: 'Столбцы переупорядочены' });
  } catch (error) {
    console.error('Reorder columns error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});
// Add a new label to board
router.post('/:id/labels', auth, async (req, res) => {
  try {
    const roleCheck = await checkRole(req.user._id, req.params.id, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const board = roleCheck.board;
    const { text, color } = req.body;

    if (!text || !color) return res.status(400).json({ message: 'Text and color are required' });

    const newLabel = { text, color };
    board.savedLabels.push(newLabel);
    await board.save();
    
    // Mongoose adds the _id after saving. Get the newly pushed one.
    const createdLabel = board.savedLabels[board.savedLabels.length - 1];

    res.status(201).json({
      savedLabels: board.savedLabels,
      newLabel: createdLabel
    });
  } catch (error) {
    console.error('Add label error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Update an existing label
router.put('/:id/labels/:labelId', auth, async (req, res) => {
  try {
    const roleCheck = await checkRole(req.user._id, req.params.id, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const board = roleCheck.board;
    const { text, color } = req.body;
    
    const label = board.savedLabels.id(req.params.labelId);
    if (!label) return res.status(404).json({ message: 'Label not found' });

    if (text !== undefined) label.text = text;
    if (color !== undefined) label.color = color;
    await board.save();

    res.json({ savedLabels: board.savedLabels });
  } catch (error) {
    console.error('Update label error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Delete a label
router.delete('/:id/labels/:labelId', auth, async (req, res) => {
  try {
    const roleCheck = await checkRole(req.user._id, req.params.id, 'member');
    if (!roleCheck.allowed) return res.status(403).json({ message: roleCheck.message });

    const board = roleCheck.board;
    const labelId = req.params.labelId;

    board.savedLabels = board.savedLabels.filter(l => l._id.toString() !== labelId);
    await board.save();

    // Cascade delete from cards
    await Card.updateMany(
      { board: board._id },
      { $pull: { labels: labelId } }
    );

    res.json({ savedLabels: board.savedLabels });
  } catch (error) {
    console.error('Delete label error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;