'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Issue, IssueStatus, IssuePriority, IssueType } from '@/models/Issue';
import { Workspace } from '@/models/Workspace';
import { User } from '@/models/User';
import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { sendEmail } from '@/lib/email/resend';
import { IssueCreatedEmail } from '@/components/emails/issue-created';
import { render } from '@react-email/components';

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
    // Notify all workspace members about the new issue
    // In a large workspace, we might want to limit this to admins or just the assignee
    // But for now, "everyone gets an email" per requirement.
    
    // Get all member user IDs
    const memberIds = workspace.members.map((m: any) => m.userId);
    const users = await User.find({ _id: { $in: memberIds } });

    // Send emails in parallel
    await Promise.all(users.map(async (user) => {
        if (user.email && user._id.toString() !== session.user.id) { // Don't email the reporter
            const html = await render(
                IssueCreatedEmail({
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

export async function getIssues(workspaceSlug: string) {
    await connectDB();
    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) return [];

    const issues = await Issue.find({ workspaceId: workspace._id })
        .populate('reporterId', 'name image')
        .populate('assigneeId', 'name image')
        .sort({ createdAt: -1 })
        .lean();

    return issues.map(issue => ({
        ...issue,
        _id: issue._id.toString(),
        workspaceId: issue.workspaceId.toString(),
        reporterId: issue.reporterId?._id?.toString() || issue.reporterId?.toString(),
        // @ts-ignore
        reporter: issue.reporterId,
        assigneeId: issue.assigneeId?._id?.toString() || issue.assigneeId?.toString(),
        // @ts-ignore
        assignee: issue.assigneeId,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
    }));
}

export async function updateIssueStatus(workspaceSlug: string, issueId: string, status: IssueStatus) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    await connectDB();
    
    await Issue.findByIdAndUpdate(issueId, { status });
    revalidatePath(`/${workspaceSlug}/issues`);
    return { success: true };
}
