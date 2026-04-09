import mongoose from 'mongoose';

export interface WorkspaceMember {
  userId: mongoose.Types.ObjectId;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  joinedAt: Date;
}

export interface TaskComment {
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
