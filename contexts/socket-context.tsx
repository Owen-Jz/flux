'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  initSocket,
  disconnectSocket,
  SocketUser,
  onPresenceUpdate,
  onTaskMoved,
  onTaskUpdated,
  onTaskCreated,
  onTaskDeleted,
  emitTaskMoved,
  emitTaskUpdated,
  emitTaskCreated,
  emitTaskDeleted,
  TaskMoveData,
  TaskUpdateData,
  TaskCreateData,
  TaskDeleteData,
} from '@/lib/socket-client';

interface SocketContextType {
  isConnected: boolean;
  onlineUsers: SocketUser[];
  emitTaskMoved: (data: TaskMoveData) => void;
  emitTaskUpdated: (data: TaskUpdateData) => void;
  emitTaskCreated: (data: TaskCreateData) => void;
  emitTaskDeleted: (data: TaskDeleteData) => void;
  onTaskMoved: (callback: (data: TaskMoveData & { movedBy?: { id: string; name: string; image?: string } }) => void) => () => void;
  onTaskUpdated: (callback: (data: TaskUpdateData & { updatedBy?: { id: string; name: string; image?: string } }) => void) => () => void;
  onTaskCreated: (callback: (data: TaskCreateData & { createdBy?: { id: string; name: string; image?: string } }) => void) => () => void;
  onTaskDeleted: (callback: (data: TaskDeleteData & { deletedBy?: { id: string; name: string; image?: string } }) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  boardId: string;
  children: React.ReactNode;
}

export function SocketProvider({ boardId, children }: SocketProviderProps) {
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<SocketUser[]>([]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && boardId) {
      const token = session.accessToken || session.user.id || 'anonymous';
      const user = {
        id: session.user.id as string,
        name: session.user.name || 'Anonymous',
        image: session.user.image || undefined,
      };

      console.log('[SocketProvider] Initializing socket for user:', user.name);
      initSocket(boardId, token, user);

      const unsubscribePresence = onPresenceUpdate((users) => {
        console.log('[SocketProvider] Presence update:', users.length, 'users');
        setOnlineUsers(users);
        setIsConnected(true);
      });

      return () => {
        console.log('[SocketProvider] Cleaning up socket');
        unsubscribePresence();
        disconnectSocket();
        setIsConnected(false);
      };
    }
  }, [boardId, session, status]);

  const handleEmitTaskMoved = useCallback((data: TaskMoveData) => {
    emitTaskMoved(data);
  }, []);

  const handleEmitTaskUpdated = useCallback((data: TaskUpdateData) => {
    emitTaskUpdated(data);
  }, []);

  const handleEmitTaskCreated = useCallback((data: TaskCreateData) => {
    emitTaskCreated(data);
  }, []);

  const handleEmitTaskDeleted = useCallback((data: TaskDeleteData) => {
    emitTaskDeleted(data);
  }, []);

  const handleOnTaskMoved = useCallback((callback: (data: TaskMoveData & { movedBy?: { id: string; name: string; image?: string } }) => void) => {
    return onTaskMoved(callback as (data: TaskMoveData & { movedBy?: { id: string; name: string; image?: string } }) => void);
  }, []);

  const handleOnTaskUpdated = useCallback((callback: (data: TaskUpdateData & { updatedBy?: { id: string; name: string; image?: string } }) => void) => {
    return onTaskUpdated(callback as (data: TaskUpdateData & { updatedBy?: { id: string; name: string; image?: string } }) => void);
  }, []);

  const handleOnTaskCreated = useCallback((callback: (data: TaskCreateData & { createdBy?: { id: string; name: string; image?: string } }) => void) => {
    return onTaskCreated(callback as (data: TaskCreateData & { createdBy?: { id: string; name: string; image?: string } }) => void);
  }, []);

  const handleOnTaskDeleted = useCallback((callback: (data: TaskDeleteData & { deletedBy?: { id: string; name: string; image?: string } }) => void) => {
    return onTaskDeleted(callback as (data: TaskDeleteData & { deletedBy?: { id: string; name: string; image?: string } }) => void);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        onlineUsers,
        emitTaskMoved: handleEmitTaskMoved,
        emitTaskUpdated: handleEmitTaskUpdated,
        emitTaskCreated: handleEmitTaskCreated,
        emitTaskDeleted: handleEmitTaskDeleted,
        onTaskMoved: handleOnTaskMoved,
        onTaskUpdated: handleOnTaskUpdated,
        onTaskCreated: handleOnTaskCreated,
        onTaskDeleted: handleOnTaskDeleted,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
