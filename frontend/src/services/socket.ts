import { io } from 'socket.io-client';

// Senior SWE: In a production Docker environment, this would be an environment variable
// For local development with Vite proxy, we connect to the root/proxy
const SOCKET_URL = window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
});

export const initSocket = (onEvent: (event: any) => void) => {
  socket.on('TRANSACTION_UPDATE', (data) => {
    console.log('Real-time Transaction Event:', data);
    onEvent(data);
  });

  socket.on('connect', () => {
    console.log('Connected to RiskStream AI Real-time Stream');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from Real-time Stream');
  });
};
