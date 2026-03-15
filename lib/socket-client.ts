import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

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

export const initSocket = (
  boardId: string,
  token: string,
  user: UserInfo
): Socket => {
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(window.location.origin, {
    auth: {
      token,
      user,
    },
    query: {
      boardId,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
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
  socket?.emit('task-moved', data);
};

export const emitTaskUpdated = (data: TaskUpdateData): void => {
  socket?.emit('task-updated', data);
};

export const emitTaskCreated = (data: TaskCreateData): void => {
  socket?.emit('task-created', data);
};

export const emitTaskDeleted = (data: TaskDeleteData): void => {
  socket?.emit('task-deleted', data);
};

export const emitCursorMove = (data: CursorPosition): void => {
  socket?.emit('cursor-move', data);
};

export const onPresenceUpdate = (callback: (users: SocketUser[]) => void): (() => void) => {
  socket?.on('presence-update', callback);
  return () => {
    socket?.off('presence-update', callback);
  };
};

export const onTaskMoved = (callback: (data: TaskMoveData & { movedBy?: UserInfo }) => void): (() => void) => {
  socket?.on('task-moved', callback);
  return () => {
    socket?.off('task-moved', callback);
  };
};

export const onTaskUpdated = (callback: (data: TaskUpdateData & { updatedBy?: UserInfo }) => void): (() => void) => {
  socket?.on('task-updated', callback);
  return () => {
    socket?.off('task-updated', callback);
  };
};

export const onTaskCreated = (callback: (data: TaskCreateData & { createdBy?: UserInfo }) => void): (() => void) => {
  socket?.on('task-created', callback);
  return () => {
    socket?.off('task-created', callback);
  };
};

export const onTaskDeleted = (callback: (data: TaskDeleteData & { deletedBy?: UserInfo }) => void): (() => void) => {
  socket?.on('task-deleted', callback);
  return () => {
    socket?.off('task-deleted', callback);
  };
};

export const onCursorMove = (callback: (data: CursorPosition & { userId: string; userName: string }) => void): (() => void) => {
  socket?.on('cursor-move', callback);
  return () => {
    socket?.off('cursor-move', callback);
  };
};
