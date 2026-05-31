const { verifyAccessToken } = require('../services/token.service');
const logger = require('../config/logger');

/**
 * Initialize Socket.io with authentication and room management
 */
const initializeSocket = (io) => {
  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      // Allow unauthenticated connections for queue viewing (patients)
      socket.user = null;
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      // Allow connection but mark as unauthenticated
      socket.user = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.user?.sub || 'anonymous'}`);

    /**
     * Patient joins queue room to receive live updates
     * Room format: queue:{clinicId}:{doctorId}:{date}
     */
    socket.on('patient:joinQueueRoom', ({ clinicId, doctorId, date }) => {
      if (!clinicId || !doctorId || !date) {
        socket.emit('error', { message: 'Invalid room parameters' });
        return;
      }

      const roomName = `queue:${clinicId}:${doctorId}:${date}`;
      socket.join(roomName);
      logger.info(`Socket ${socket.id} joined room: ${roomName}`);

      socket.emit('queue:joined', { roomName, message: 'Connected to live queue' });
    });

    /**
     * Receptionist/Doctor joins queue management room
     */
    socket.on('staff:joinQueueRoom', ({ clinicId, doctorId, date }) => {
      if (!socket.user) {
        socket.emit('error', { message: 'Authentication required' });
        return;
      }

      const roomName = `queue:${clinicId}:${doctorId}:${date}`;
      socket.join(roomName);
      logger.info(`Staff ${socket.user.sub} joined room: ${roomName}`);

      socket.emit('queue:joined', { roomName, message: 'Connected to queue management' });
    });

    /**
     * Leave queue room
     */
    socket.on('leaveQueueRoom', ({ clinicId, doctorId, date }) => {
      const roomName = `queue:${clinicId}:${doctorId}:${date}`;
      socket.leave(roomName);
      logger.info(`Socket ${socket.id} left room: ${roomName}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, { error });
    });
  });

  logger.info('Socket.io initialized');
};

module.exports = { initializeSocket };
