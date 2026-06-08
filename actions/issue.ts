'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Issue, IssueStatus, IssuePriority, IssueType, IIssueComment } from '@/models/Issue';
import { Workspace } from '@/models/Workspace';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { User } from '@/models/User';
import { Task } from '@/models/Task';
import { Board } from '@/models/Board';
import { revalidatePath } from 'next/cache';
import { Types } from 'mongoose';
import { logActivity } from './activity';
import { sendEmail } from '@/lib/email/resend';
import { IssueCreatedEmail } from '@/components/emails/issue-created';
import { render } from '@react-email/components';
import React from 'react';
import { TASK_ORDER_INCREMENT } from '@/lib/constants';

interface CreateIssueData {
    title: string;
    description?: string;
    priority: IssuePriority;
    type: IssueType;
    assigneeId?: string;
}

export async function createIssue(workspaceSlug: string, data: CreateIssueData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) throw new Error('Workspace not found');

    if (!isWorkspaceMember(workspace, session.user.id)) {
        throw new Error('Access denied');
    }

    // An assignee must be a real member of this workspace — otherwise a crafted
    // call could store an arbitrary user id and fire an issue email at them.
    if (data.assigneeId) {
        const assigneeIsMember = workspace.members.some(
            (m: { userId: { toString(): string } }) => m.userId.toString() === data.assigneeId!.toString()
        );
        if (!assigneeIsMember) {
            throw new Error('Assignee must be a workspace member');
        }
    }

    const issue = await Issue.create({
        workspaceId: workspace._id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        type: data.type,
        reporterId: session.user.id,
        assigneeId: data.assigneeId,
        status: 'OPEN'
    });

    await logActivity({
        workspaceSlug,
        boardSlug: 'issues', // Special slug for issues
        taskId: issue._id.toString(),
        type: 'TASK_CREATED', // Reuse type for now or add ISSUE_CREATED
        title: 'Issue Reported',
        description: `Reported issue: ${data.title}`,
    });

    // EMAIL NOTIFICATION LOGIC
    // Notify the people who actually need to act on the issue: every workspace
    // admin (they oversee everything) plus the assignee if one was set — never
    // the whole workspace. The reporter is never emailed about their own report.
    const targetIds = new Set<string>(
        workspace.members
            .filter((m: { role?: string }) => m.role === 'ADMIN')
            .map((m: { userId: { toString(): string } }) => m.userId.toString())
    );
    if (data.assigneeId) {
        targetIds.add(data.assigneeId.toString());
    }
    targetIds.delete(session.user.id);

    const users = await User.find({ _id: { $in: Array.from(targetIds) } });

    // Send emails in parallel
    await Promise.all(users.map(async (user) => {
        if (user.email) {
            const html = await render(
                React.createElement(IssueCreatedEmail, {
                    workspaceName: workspace.name,
                    issueTitle: issue.title,
                    issueType: issue.type,
                    reporterName: session.user.name || 'A teammate',
                    issueUrl: `${process.env.NEXTAUTH_URL}/${workspaceSlug}/issues`,
                })
            );

            await sendEmail({
                to: user.email,
                subject: `New Issue in ${workspace.name}: ${issue.title}`,
                html,
            });
        }
    }));

    revalidatePath(`/${workspaceSlug}/issues`);
    return { id: issue._id.toString() };
}

/** Author embedded in a serialized comment (JSON-safe). */
export interface SerializedCommentAuthor {
    id: string;
    name: string;
    email: string;
    image: string | null;
}

/** A serialized issue comment as sent to the client. */
export interface SerializedIssueComment {
    id: string;
    content: string;
    userId: string;
    user: SerializedCommentAuthor;
    createdAt: string;
}

/** Minimal shape of a populated author document (lean). */
interface PopulatedAuthor {
    _id: Types.ObjectId | string;
    name?: string;
    email?: string;
    image?: string | null;
}

function isPopulatedAuthor(value: unknown): value is PopulatedAuthor {
    return typeof value === 'object' && value !== null && '_id' in value;
}

/** Serialize a populated comment author into the JSON-safe author shape. */
function serializeCommentAuthor(user: unknown): SerializedCommentAuthor {
    if (isPopulatedAuthor(user)) {
        return {
            id: user._id.toString(),
            name: user.name ?? 'Unknown User',
            email: user.email ?? '',
            image: user.image ?? null,
        };
    }
    return { id: '', name: 'Unknown User', email: '', image: null };
}

/** Lean shape of a comment subdocument after populating its author. */
interface LeanIssueComment {
    _id: Types.ObjectId | string;
    content: string;
    userId: PopulatedAuthor | Types.ObjectId | string;
    createdAt: Date;
}

/** Serialize a single (populated) comment subdocument. */
function serializeIssueComment(comment: LeanIssueComment): SerializedIssueComment {
    const author = serializeCommentAuthor(comment.userId);
    return {
        id: comment._id.toString(),
        content: comment.content,
        userId: author.id || comment.userId.toString(),
        user: author,
        createdAt: new Date(comment.createdAt).toISOString(),
    };
}

export async function getIssues(workspaceSlug: string) {
    const session = await auth();

    await connectDB();
    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return [];

    // Members see issues; guests get a read-only view when the workspace is
    // publicly accessible. Issues are workspace-scoped (not board-scoped), so a
    // public workspace exposes its feedback list to guests in read-only form.
    const member = session?.user?.id ? isWorkspaceMember(workspace, session.user.id) : null;
    const hasPublicAccess = workspace.settings?.publicAccess === true;
    if (!member && !hasPublicAccess) return [];

    const issues = await Issue.find({ workspaceId: workspace._id })
        .populate('reporterId', 'name image')
        .populate('assigneeId', 'name image')
        .populate('comments.userId', 'name email image')
        .sort({ createdAt: -1 })
        .lean();

    const serializeUser = (user: unknown) => {
        if (!isPopulatedAuthor(user)) return null;
        return {
            name: user.name ?? '',
            image: user.image ?? null,
        };
    };

    const refId = (value: unknown): string | null => {
        if (isPopulatedAuthor(value)) return value._id.toString();
        if (value === null || value === undefined) return null;
        return value.toString();
    };

    return issues.map(issue => ({
        _id: issue._id.toString(),
        workspaceId: issue.workspaceId.toString(),
        title: issue.title,
        description: issue.description ?? null,
        status: issue.status,
        priority: issue.priority,
        type: issue.type,
        reporterId: refId(issue.reporterId),
        reporter: serializeUser(issue.reporterId),
        assigneeId: refId(issue.assigneeId),
        assignee: serializeUser(issue.assigneeId),
        comments: ((issue.comments ?? []) as LeanIssueComment[]).map(serializeIssueComment),
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
    }));
}

export async function addIssueComment(workspaceSlug: string, issueId: string, content: string): Promise<SerializedIssueComment> {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const trimmed = content.trim();
    if (!trimmed) throw new Error('Comment cannot be empty');

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) throw new Error('Workspace not found');

    // Verify user is a member of the workspace
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) throw new Error('Unauthorized');

    // Only ADMIN and EDITOR may comment; VIEWERs are read-only
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to comment');
    }

    const issue = await Issue.findOne({ _id: issueId, workspaceId: workspace._id });
    if (!issue) throw new Error('Issue not found');

    issue.comments.push({
        content: trimmed,
        userId: new Types.ObjectId(session.user.id),
    } as unknown as IIssueComment);

    await issue.save();

    // The just-pushed subdocument's _id is the source of truth.
    const created = issue.comments[issue.comments.length - 1];
    const createdId = created._id.toString();

    // Re-fetch with the author populated, then locate the exact subdoc by id.
    const populated = await Issue.findById(issueId)
        .populate('comments.userId', 'name email image')
        .lean();

    const populatedComment = ((populated?.comments ?? []) as unknown as LeanIssueComment[])
        .find((c) => c._id.toString() === createdId);

    revalidatePath(`/${workspaceSlug}/issues`);

    if (!populatedComment) {
        // Fallback: serialize from the session if the re-fetch missed it.
        return {
            id: createdId,
            content: trimmed,
            userId: session.user.id,
            user: {
                id: session.user.id,
                name: session.user.name ?? 'Unknown User',
                email: session.user.email ?? '',
                image: session.user.image ?? null,
            },
            createdAt: new Date(created.createdAt).toISOString(),
        };
    }

    return serializeIssueComment(populatedComment);
}

export async function updateIssueStatus(workspaceSlug: string, issueId: string, status: IssueStatus) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await connectDB();

    // SECURITY FIX: Verify issue belongs to user's workspace before updating
    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) throw new Error('Workspace not found');

    const issue = await Issue.findOne({ _id: issueId, workspaceId: workspace._id });
    if (!issue) throw new Error('Issue not found');

    // Verify user is a member of the workspace
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) throw new Error('Unauthorized');

    // Only ADMIN and EDITOR may change issue status
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to update issues');
    }

    await Issue.findByIdAndUpdate(issueId, { status });
    revalidatePath(`/${workspaceSlug}/issues`);
    return { success: true };
}

export async function updateIssue(workspaceSlug: string, issueId: string, data: Partial<{ title: string; description: string; priority: IssuePriority; type: IssueType; status: IssueStatus; assigneeId: string | null }>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await connectDB();

    // SECURITY FIX: Verify issue belongs to user's workspace before updating
    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) throw new Error('Workspace not found');

    const issue = await Issue.findOne({ _id: issueId, workspaceId: workspace._id });
    if (!issue) throw new Error('Issue not found');

    // Verify user is a member of the workspace
    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) throw new Error('Unauthorized');

    // Only ADMIN and EDITOR may edit issues
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to update issues');
    }

    await Issue.findByIdAndUpdate(issueId, data);
    revalidatePath(`/${workspaceSlug}/issues`);
    return { success: true };
}

export async function moveIssueToBoard(workspaceSlug: string, issueId: string, boardId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await connectDB();

    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) throw new Error('Workspace not found');

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!member) {
        throw new Error('Access denied');
    }

    // Only ADMIN and EDITOR may convert issues into board tasks
    if (!hasRole(member, 'ADMIN', 'EDITOR')) {
        throw new Error('You do not have permission to convert issues to tasks');
    }

    const issue = await Issue.findOne({ _id: issueId, workspaceId: workspace._id });
    if (!issue) throw new Error('Issue not found');

    const board = await Board.findOne({ _id: boardId, workspaceId: workspace._id });
    if (!board) throw new Error('Board not found');

    // Get the highest order in BACKLOG column for this board
    const highestOrder = await Task.findOne({
        boardId: board._id,
        status: 'BACKLOG',
    }).sort({ order: -1 }).select('order');

    const newOrder = (highestOrder?.order ?? 0) + TASK_ORDER_INCREMENT;

    // Create the task
    await Task.create({
        workspaceId: workspace._id,
        boardId: board._id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority === 'CRITICAL' ? 'HIGH' : issue.priority,
        status: 'BACKLOG',
        order: newOrder,
        assignees: issue.assigneeId ? [issue.assigneeId] : [],
        subtasks: [],
    });

    // Delete the issue
    await Issue.findByIdAndDelete(issueId);

    revalidatePath(`/${workspaceSlug}/issues`);
    revalidatePath(`/${workspaceSlug}/board/${board.slug}`);

    return { success: true };
}
