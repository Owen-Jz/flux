import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspaceInvite extends Document {
  email: string;
  workspaceId: mongoose.Types.ObjectId;
  workspaceSlug: string;
  workspaceName: string;
  invitedBy: mongoose.Types.ObjectId;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const WorkspaceInviteSchema = new Schema<IWorkspaceInvite>({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  workspaceSlug: {
    type: String,
    required: true,
  },
  workspaceName: {
    type: String,
    required: true,
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['VIEWER', 'EDITOR', 'ADMIN'],
    default: 'VIEWER',
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// TTL index to auto-delete expired invites
WorkspaceInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
WorkspaceInviteSchema.index({ email: 1, workspaceId: 1 });

export const WorkspaceInvite = mongoose.models.WorkspaceInvite || mongoose.model<IWorkspaceInvite>('WorkspaceInvite', WorkspaceInviteSchema);
