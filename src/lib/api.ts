export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export type Level = 'P25' | 'P50' | 'P100' | 'P250' | 'P500' | 'P1000';

export type User = {
  id: string;
  name: string;
  email: string;
  age: number | null;
  region: string | null;
  level: Level | null;
  availableDates: string[];
  isAdmin: boolean;
};

export type MatchGroupMember = {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'isAdmin'>;
};

export type TimeVote = {
  id: string;
  userId: string;
  time: string;
  user: { id: string; name: string };
};

export type CourtBookingVote = {
  id: string;
  userId: string;
  user: { id: string; name: string };
};

export type MatchGroup = {
  id: string;
  level: Level;
  region: string;
  date: string;
  isDuo: boolean;
  status: 'OPEN' | 'FULL' | 'CONFIRMED';
  confirmedTime: string | null;
  courtBooked: boolean;
  members: MatchGroupMember[];
  timeVotes: TimeVote[];
  courtBookingVotes: CourtBookingVote[];
  unreadCount: number;
};

export type CycleDate = {
  date: string;
  label: string;
};

export type Message = {
  id: string;
  groupId: string;
  userId: string | null;
  content: string;
  createdAt: string;
  user: { id: string; name: string; isAdmin: boolean } | null;
};

export type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
};

export type Conversation = {
  userId: string;
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  fromMe: boolean;
  unreadCount: number;
};

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? 'Request failed');
  }
  return data as T;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: { name, email, password } }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } }),

  forgotPassword: (email: string) =>
    request<{ resetCode: string; expiresInMinutes: number }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ token: string; user: User }>('/auth/reset-password', {
      method: 'POST',
      body: { email, code, newPassword },
    }),

  getMe: (token: string) => request<User>('/profile/me', { token }),

  updateProfile: (
    token: string,
    data: { age?: number; region?: string; level?: Level; availableDates?: string[] }
  ) =>
    request<User>('/profile/me', { method: 'PUT', token, body: data }),

  getCycle: (token: string) => request<{ cycleStart: string; dates: CycleDate[] }>('/matching/cycle', { token }),

  findMatch: (token: string) => request<{ groups: MatchGroup[] }>('/matching/find', { method: 'POST', token }),

  findDuoMatch: (token: string, partnerId: string) =>
    request<{ groups: MatchGroup[] }>('/matching/find-duo', { method: 'POST', token, body: { partnerId } }),

  searchPlayers: (token: string, query: string) =>
    request<{ players: Pick<User, 'id' | 'name' | 'level' | 'region'>[] }>(
      `/players/search?q=${encodeURIComponent(query)}`,
      { token }
    ),

  getMatchStatus: (token: string) => request<{ groups: MatchGroup[] }>('/matching/status', { token }),

  getMessages: (token: string, groupId: string) =>
    request<{ messages: Message[] }>(`/messages/${groupId}`, { token }),

  getSavedPlayers: (token: string) =>
    request<{ players: Pick<User, 'id' | 'name' | 'level'>[] }>('/players/saved', { token }),

  savePlayer: (token: string, playerId: string) =>
    request<{ ok: true }>(`/players/${playerId}/save`, { method: 'POST', token }),

  unsavePlayer: (token: string, playerId: string) =>
    request<{ ok: true }>(`/players/${playerId}/save`, { method: 'DELETE', token }),

  reportPlayer: (token: string, playerId: string, reason: string) =>
    request<{ ok: true }>(`/players/${playerId}/report`, { method: 'POST', token, body: { reason } }),

  getDirectMessages: (token: string, userId: string) =>
    request<{ messages: DirectMessage[] }>(`/dm/${userId}`, { token }),

  getConversations: (token: string) =>
    request<{ conversations: Conversation[] }>('/dm/conversations', { token }),

  getUnreadDmCount: (token: string) =>
    request<{ count: number }>('/dm/unread-count', { token }),

  getAdminGroups: (token: string) => request<{ groups: MatchGroup[] }>('/admin/groups', { token }),

  getAdminPlayers: (token: string) => request<{ players: User[] }>('/admin/players', { token }),

  addPlayerToGroup: (
    token: string,
    groupId: string,
    data: { mode: 'register'; name: string; email: string; password: string } | { mode: 'login'; email: string; password: string }
  ) =>
    request<{ player: User; group: MatchGroup }>(`/admin/groups/${groupId}/add-player`, {
      method: 'POST',
      token,
      body: data,
    }),
};

export const LEVELS: Level[] = ['P25', 'P50', 'P100', 'P250', 'P500', 'P1000'];
