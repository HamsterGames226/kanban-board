const Board = require('../models/Board');

// Проверка что пользователь участник доски
function requireBoardMember(boardIdParam = 'boardId') {
  return async (req, res, next) => {
    try {
      const boardId = req.params[boardIdParam] || req.body.boardId || req.params.id;
      if (!boardId) return res.status(400).json({ message: 'Board ID required' });

      const board = await Board.findById(boardId);
      if (!board) return res.status(404).json({ message: 'Доска не найдена' });

      const member = board.members.find(m => m.user.toString() === req.user._id.toString());
      if (!member) return res.status(403).json({ message: 'Нет доступа' });

      req.board = board;
      req.memberRole = member.role;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  };
}

// Проверка что пользователь может редактировать (не наблюдатель)
function requireEditor() {
  return (req, res, next) => {
    if (req.memberRole === 'viewer') {
      return res.status(403).json({ message: 'Наблюдатели не могут редактировать' });
    }
    next();
  };
}

// Проверка что пользователь админ или владелец
function requireAdmin() {
  return (req, res, next) => {
    if (!['owner', 'admin'].includes(req.memberRole)) {
      return res.status(403).json({ message: 'Требуются права администратора' });
    }
    next();
  };
}

module.exports = { requireBoardMember, requireEditor, requireAdmin };