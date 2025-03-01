import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8080'; // Assuming your backend runs on this port
let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      path: '/ws', // This should match your Spring WebSocket configuration
    });
    socket.on('connect', () => {
        console.log('Connected to backend WebSocket');
      });
  
      socket.on('disconnect', () => {
        console.log('Disconnected from backend WebSocket');
      });
    }
    return socket;
  }
  export const getSocket = (): Socket | null => {
    return socket;
  };
