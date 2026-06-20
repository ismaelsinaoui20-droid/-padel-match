import { io, type Socket } from 'socket.io-client';

import { API_URL } from '@/lib/api';

export function createChatSocket(token: string): Socket {
  return io(API_URL, { auth: { token }, transports: ['websocket'] });
}
