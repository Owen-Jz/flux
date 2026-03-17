'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let isConnecting = false;
let pendingCallbacks: {
  event: string;
  callback: (...args: unknown[]) => void;
}[] = [];

interface UserInfo {
  id: string;
  name: string;
  image?: string;
}

export interface SocketUser {
  userId: string;
  name: string;
  image?: string;
  socketId: string;
}

export interface TaskMoveData {
  taskId: string;
  fromColumn: string;
  toColumn: string;
  newIndex: number;
}

export interface TaskUpdateData {
  taskId: string;
  updates: Record<string, unknown>;
}

export interface TaskCreateData {
  task: Record<string, unknown>;
}

export interface TaskDeleteData {
  taskId: string;
}

export interface CursorPosition {
  x: number;
  y: number;
}

// Process any pending callbacks that were registered before socket connected
const processPendingCallbacks = () => {
  pendingCallbacks.forEach(({ event, callback }) => {
    socket?.on(event, callback as (...args: unknown[]) => void);
  });
  pendingCallbacks = [];
};

export const initSocket = (
  boardId: string,
  token: string,
  user: UserInfo
): Socket => {
  if (socket?.connected) {
    socket.disconnect();
  }

  console.log('[Socket] Initializing socket for board:', boardId);

  socket = io(window.location.origin, {
    auth: {
      token,
      user,
    },
    query: {
      boardId,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    isConnecting = false;
    processPendingCallbacks();
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    isConnecting = false;
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinBoard = (boardId: string): void => {
  socket?.emit('join-board', boardId);
};

export const leaveBoard = (boardId: string): void => {
  socket?.emit('leave-board', boardId);
};

export const emitTaskMoved = (data: TaskMoveData): void => {
  console.log('[Socket] Emitting task-moved:', data);
  if (socket?.connected) {
    socket.emit('task-moved', data);
  } else {
    console.log('[Socket] Socket not connected, cannot emit');
  }
};

export const emitTaskUpdated = (data: TaskUpdateData): void => {
  console.log('[Socket] Emitting task-updated:', data);
  if (socket?.connected) {
    socket.emit('task-updated', data);
  }
};

export const emitTaskCreated = (data: TaskCreateData): void => {
  console.log('[Socket] Emitting task-created:', data);
  if (socket?.connected) {
    socket.emit('task-created', data);
  }
};

export const emitTaskDeleted = (data: TaskDeleteData): void => {
  console.log('[Socket] Emitting task-deleted:', data);
  if (socket?.connected) {
    socket.emit('task-deleted', data);
  }
};

export const emitCursorMove = (data: CursorPosition): void => {
  socket?.emit('cursor-move', data);
};

// Helper to register listeners that works whether socket is connected or not
const registerListener = (event: string, callback: (...args: unknown[]) => void): (() => void) => {
  if (!socket) {
    console.log('[Socket] No socket, queuing listener for:', event);
    pendingCallbacks.push({ event, callback });
    return () => {};
  }

  if (socket.connected) {
    socket.on(event, callback);
    console.log('[Socket] Registered listener for:', event);
  } else {
    console.log('[Socket] Socket not connected, queuing listener for:', event);
    pendingCallbacks.push({ event, callback });
  }

  return () => {
    socket?.off(event, callback);
  };
};

export const onPresenceUpdate = (callback: (users: SocketUser[]) => void): (() => void) => {
  return registerListener('presence-update', ((users: SocketUser[]) => callback(users)) as (...args: unknown[]) => void);
};

export const onTaskMoved = (callback: (data: TaskMoveData & { movedBy?: UserInfo }) => void): (() => void) => {
  return registerListener('task-moved', ((data: TaskMoveData & { movedBy?: UserInfo }) => {
    console.log('[Socket] task-moved received:', data);
    callback(data);
  }) as (...args: unknown[]) => void);
};

export const onTaskUpdated = (callback: (data: TaskUpdateData & { updatedBy?: UserInfo }) => void): (() => void) => {
  return registerListener('task-updated', ((data: TaskUpdateData & { updatedBy?: UserInfo }) => callback(data)) as (...args: unknown[]) => void);
};

export const onTaskCreated = (callback: (data: TaskCreateData & { createdBy?: UserInfo }) => void): (() => void) => {
  return registerListener('task-created', ((data: TaskCreateData & { createdBy?: UserInfo }) => callback(data)) as (...args: unknown[]) => void);
};

export const onTaskDeleted = (callback: (data: TaskDeleteData & { deletedBy?: UserInfo }) => void): (() => void) => {
  return registerListener('task-deleted', ((data: TaskDeleteData & { deletedBy?: UserInfo }) => callback(data)) as (...args: unknown[]) => void);
};

export const onCursorMove = (callback: (data: CursorPosition & { userId: string; userName: string }) => void): (() => void) => {
  return registerListener('cursor-move', ((data: CursorPosition & { userId: string; userName: string }) => callback(data)) as (...args: unknown[]) => void);
};
