import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import next from 'next';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Track online users per board
interface UserPresence {
  userId: string;
  name: string;
  image?: string;
  socketId: string;
}

interface BoardRoom {
  users: Map<string, UserPresence>;
}

const boardRooms = new Map<string, BoardRoom>();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket.io authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    const boardId = socket.handshake.query.boardId as string;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Store user info from token (decoded by NextAuth)
    socket.data.user = socket.handshake.auth.user;
    socket.data.boardId = boardId;

    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    const user = socket.data.user as { id: string; name: string; image?: string } | undefined;
    const boardId = socket.data.boardId as string;

    if (!user || !boardId) {
      socket.disconnect();
      return;
    }

    // Join board room
    socket.join(boardId);

    // Initialize room if not exists
    if (!boardRooms.has(boardId)) {
      boardRooms.set(boardId, { users: new Map() });
    }

    const room = boardRooms.get(boardId)!;
    room.users.set(user.id, {
      userId: user.id,
      name: user.name,
      image: user.image,
      socketId: socket.id,
    });

    // Broadcast presence update
    io.to(boardId).emit('presence-update', Array.from(room.users.values()));

    // Handle task move events
    socket.on('task-moved', (data) => {
      console.log('[Server] Received task-moved, broadcasting to board:', boardId);
      socket.to(boardId).emit('task-moved', {
        ...data,
        movedBy: user,
      });
    });

    // Handle task update events
    socket.on('task-updated', (data) => {
      socket.to(boardId).emit('task-updated', {
        ...data,
        updatedBy: user,
      });
    });

    // Handle task create events
    socket.on('task-created', (data) => {
      socket.to(boardId).emit('task-created', {
        ...data,
        createdBy: user,
      });
    });

    // Handle task delete events
    socket.on('task-deleted', (data) => {
      socket.to(boardId).emit('task-deleted', {
        ...data,
        deletedBy: user,
      });
    });

    // Handle cursor movement
    socket.on('cursor-move', (data) => {
      socket.to(boardId).emit('cursor-move', {
        ...data,
        userId: user.id,
        userName: user.name,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      if (room) {
        room.users.delete(user.id);
        io.to(boardId).emit('presence-update', Array.from(room.users.values()));

        // Clean up empty rooms
        if (room.users.size === 0) {
          boardRooms.delete(boardId);
        }
      }
    });

    // Leave board room explicitly
    socket.on('leave-board', () => {
      socket.leave(boardId);
      if (room) {
        room.users.delete(user.id);
        io.to(boardId).emit('presence-update', Array.from(room.users.values()));
      }
    });
  });

  // Handle all Next.js routes
  server.use((req: Request, res: Response) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
  });
});
