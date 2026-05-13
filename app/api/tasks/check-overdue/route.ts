import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { Workspace } from '@/models/Workspace';
import { User } from '@/models/User';
import { render } from '@react-email/components';
import React from 'react';
import { TaskOverdueEmail } from '@/components/emails/task-overdue';
import { sendEmail } from '@/lib/email/resend';
import { getAppUrl } from '@/lib/port';

export async function POST(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const now = new Date();

    // Find tasks that are overdue and haven't been notified yet
    const overdueTasks = await Task.find({
      dueDate: { $lt: now },
      status: { $nin: ['DONE', 'ARCHIVED'] },
      assignees: { $exists: true, $ne: [] },
    })
      .populate('assignees', 'name email')
      .populate({
        path: 'boardId',
        select: 'name slug',
        populate: { path: 'workspaceId', select: 'name slug' },
      })
      .lean();

    let emailsSent = 0;

    for (const task of overdueTasks) {
      const board = task.boardId as any;
      const workspace = board.workspaceId as any;

      if (!board || !workspace || !task.assignees || (task.assignees as any[]).length === 0) {
        continue;
      }

      const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || getAppUrl()}/${workspace.slug}/board/${board.slug}?task=${task._id}`;

      // Send email to each assignee
      const assigneeEmails = (task.assignees as any[]).filter((a) => a.email);

      for (const assignee of assigneeEmails) {
        try {
          const emailHtml = await render(
            React.createElement(TaskOverdueEmail, {
              recipientName: assignee.name || 'User',
              taskTitle: task.title,
              workspaceName: workspace.name,
              boardName: board.name,
              taskUrl,
              dueDate: task.dueDate!.toISOString(),
            })
          );

          await sendEmail({
            to: assignee.email,
            subject: `Task Overdue: ${task.title}`,
            html: emailHtml,
          });

          emailsSent++;
        } catch (emailError) {
          console.error(`Failed to send overdue email to ${assignee.email}:`, emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${overdueTasks.length} overdue tasks, sent ${emailsSent} emails`,
    });
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
    return NextResponse.json(
        { error: 'Failed to check overdue tasks' },
        { status: 500 }
    );
  }
}
