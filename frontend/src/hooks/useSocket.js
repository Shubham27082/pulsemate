import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

/**
 * Hook for managing Socket.io connection and queue room subscriptions
 */
const useSocket = () => {
  const socketRef = useRef(null);

  const getSocket = useCallback(() => {
    if (!socketInstance) {
      const token = localStorage.getItem('accessToken');
      socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }
    socketRef.current = socketInstance;
    return socketInstance;
  }, []);

  const joinQueueRoom = useCallback(({ clinicId, doctorId, date }) => {
    const socket = getSocket();
    socket.emit('patient:joinQueueRoom', { clinicId, doctorId, date });
  }, [getSocket]);

  const joinStaffQueueRoom = useCallback(({ clinicId, doctorId, date }) => {
    const socket = getSocket();
    socket.emit('staff:joinQueueRoom', { clinicId, doctorId, date });
  }, [getSocket]);

  const leaveQueueRoom = useCallback(({ clinicId, doctorId, date }) => {
    if (socketRef.current) {
      socketRef.current.emit('leaveQueueRoom', { clinicId, doctorId, date });
    }
  }, []);

  const onEvent = useCallback((event, handler) => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [getSocket]);

  const disconnect = useCallback(() => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  }, []);

  return { getSocket, joinQueueRoom, joinStaffQueueRoom, leaveQueueRoom, onEvent, disconnect };
};

export default useSocket;
