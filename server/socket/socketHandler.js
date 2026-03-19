const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('Socket auth: no token');
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        console.log('Socket auth: user not found');
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.log('Socket auth error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`✅ Socket connected: ${socket.user.username} (${socket.id})`);

    await User.findByIdAndUpdate(socket.user._id, { status: 'online' });

    socket.on('board:join', (boardId) => {
      socket.join(`board:${boardId}`);
      console.log(`📌 ${socket.user.username} joined board: ${boardId}`);

      // Tell others in this board
      socket.to(`board:${boardId}`).emit('user:online', {
        userId: socket.user._id,
        username: socket.user.username
      });
    });

    socket.on('board:leave', (boardId) => {
      socket.leave(`board:${boardId}`);
      console.log(`📤 ${socket.user.username} left board: ${boardId}`);

      socket.to(`board:${boardId}`).emit('user:offline', {
        userId: socket.user._id
      });
    });

    socket.on('disconnect', async () => {
      console.log(`❌ Socket disconnected: ${socket.user.username}`);
      await User.findByIdAndUpdate(socket.user._id, { status: 'offline' });

      for (const room of socket.rooms) {
        if (room.startsWith('board:')) {
          io.to(room).emit('user:offline', {
            userId: socket.user._id
          });
        }
      }
    });
  });
};