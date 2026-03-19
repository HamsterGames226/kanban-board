const express = require('express');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');
const auth = require('../middleware/auth');
const router = express.Router();

// Helper: check role
function getMemberRole(board, userId) {
  const member = board.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
}

function isAdminOrOwner(board, userId) {
  const role = getMemberRole(board, userId);
  return role === 'owner' || role === 'admin';
}

// Get all boards
router.get('/', auth, async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .populate('owner', 'username avatar customAvatar displayName')
    .populate('members.user', 'username avatar customAvatar displayName')
    .sort({ updatedAt: -1 });

    res.json(boards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Create board
router.post('/', auth, async (req, res) => {
  try {
    const { title, description } = req.body;

    const board = new Board({
      title,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });

    board.generateInviteCode();
    await board.save();

    const defaultColumns = ['Надо сделать', 'В работе', 'На проверке', 'Готово'];
    const columnColors = ['#ed4245', '#fee75c', '#5865f2', '#57f287'];

    for (let i = 0; i < defaultColumns.length; i++) {
      const column = new Column({
        title: defaultColumns[i],
        board: board._id,
        order: i,
        color: columnColors[i]
      });
      await column.save();
      board.columns.push(column._id);
    }

    await board.save();

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName')
      .populate('columns');

    res.status(201).json(populatedBoard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Get single board
router.get('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName email status')
      .populate({
        path: 'columns',
        options: { sort: { order: 1 } },
        populate: {
          path: 'cards',
          options: { sort: { order: 1 } },
          populate: [
            { path: 'assignees', select: 'username avatar customAvatar displayName' },
            { path: 'createdBy', select: 'username avatar customAvatar displayName' },
            { path: 'comments.user', select: 'username avatar customAvatar displayName' }
          ]
        }
      });

    if (!board) {
      return res.status(404).json({ message: 'Доска не найдена' });
    }

    const isMember = board.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ message: 'Нет доступа' });
    }

    res.json(board);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Update board (admin/owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Доска не найдена' });

    if (!isAdminOrOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Только владелец или администратор может изменять доску' });
    }

    const { title, description, background } = req.body;
    if (title !== undefined) board.title = title;
    if (description !== undefined) board.description = description;
    if (background !== undefined) board.background = background;

    await board.save();

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });

    const updatedBoard = await Board.findById(board._id)
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName');

    res.json(updatedBoard);
  } catch (error) {
    console.error('Board update error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Delete board (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Доска не найдена' });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Только владелец может удалить доску' });
    }

    await Card.deleteMany({ board: board._id });
    await Column.deleteMany({ board: board._id });
    await Board.findByIdAndDelete(board._id);

    global.io.in(`board:${board._id}`).emit('board:deleted', { boardId: board._id });

    res.json({ message: 'Доска удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Join board via invite code
router.post('/join/:inviteCode', auth, async (req, res) => {
  try {
    const board = await Board.findOne({ inviteCode: req.params.inviteCode });
    if (!board) {
      return res.status(404).json({ message: 'Неверный код приглашения' });
    }

    const alreadyMember = board.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: 'Вы уже участник', boardId: board._id });
    }

    board.members.push({ user: req.user._id, role: 'member' });
    await board.save();

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });

    const populatedBoard = await Board.findById(board._id)
      .populate('owner', 'username avatar customAvatar displayName')
      .populate('members.user', 'username avatar customAvatar displayName');

    res.json(populatedBoard);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Invite user
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Доска не найдена' });

    if (!isAdminOrOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Нет прав для приглашения' });
    }

    const alreadyMember = board.members.some(m => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ message: 'Пользователь уже участник' });
    }

    board.members.push({ user: userId, role: 'member' });
    await board.save();

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });

    const updatedBoard = await Board.findById(board._id)
      .populate('members.user', 'username avatar customAvatar displayName email');

    res.json(updatedBoard);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Change member role (owner/admin only)
router.put('/:id/members/:userId/role', auth, async (req, res) => {
  try {
    const { role } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Доска не найдена' });

    const requesterRole = getMemberRole(board, req.user._id);

    // Only owner can assign admin
    if (role === 'admin' && requesterRole !== 'owner') {
      return res.status(403).json({ message: 'Только владелец может назначать администраторов' });
    }

    // Only owner/admin can change roles
    if (!['owner', 'admin'].includes(requesterRole)) {
      return res.status(403).json({ message: 'Нет прав для изменения ролей' });
    }

    // Can't change owner's role
    if (req.params.userId === board.owner.toString()) {
      return res.status(400).json({ message: 'Нельзя изменить роль владельца' });
    }

    // Admin can't change other admin's role
    if (requesterRole === 'admin') {
      const targetRole = getMemberRole(board, req.params.userId);
      if (targetRole === 'admin') {
        return res.status(403).json({ message: 'Администратор не может изменять роль другого администратора' });
      }
    }

    const member = board.members.find(m => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Участник не найден' });

    member.role = role;
    await board.save();

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });

    res.json({ message: 'Роль изменена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Kick member (owner/admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Доска не найдена' });

    const isSelf = req.params.userId === req.user._id.toString();

    if (!isSelf) {
      // Kicking someone else — need admin/owner
      if (!isAdminOrOwner(board, req.user._id)) {
        return res.status(403).json({ message: 'Нет прав для удаления участников' });
      }

      // Can't kick owner
      if (req.params.userId === board.owner.toString()) {
        return res.status(400).json({ message: 'Нельзя удалить владельца' });
      }

      // Admin can't kick other admin
      const requesterRole = getMemberRole(board, req.user._id);
      const targetRole = getMemberRole(board, req.params.userId);
      if (requesterRole === 'admin' && targetRole === 'admin') {
        return res.status(403).json({ message: 'Администратор не может удалить другого администратора' });
      }
    }

    board.members = board.members.filter(
      m => m.user.toString() !== req.params.userId
    );
    await board.save();

    // Notify kicked user
    global.io.in(`board:${board._id}`).emit('member:removed', {
      boardId: board._id,
      userId: req.params.userId
    });

    global.io.in(`board:${board._id}`).emit('board:refresh', { boardId: board._id });

    res.json({ message: 'Участник удалён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Regenerate invite code
router.post('/:id/regenerate-invite', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Доска не найдена' });

    if (!isAdminOrOwner(board, req.user._id)) {
      return res.status(403).json({ message: 'Нет прав' });
    }

    board.generateInviteCode();
    await board.save();

    res.json({ inviteCode: board.inviteCode });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;