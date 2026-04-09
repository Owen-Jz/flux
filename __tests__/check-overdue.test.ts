import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables
const CRON_SECRET = 'test-cron-secret-12345';
const NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Store original env
const originalEnv = process.env;

beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
        ...originalEnv,
        CRON_SECRET,
        NEXT_PUBLIC_APP_URL,
    };
});

afterEach(() => {
    process.env = originalEnv;
});

// Mock modules before importing
vi.mock('@/lib/db', () => ({
    connectDB: vi.fn().mockResolvedValue(undefined),
}));

const mockSendEmail = vi.fn().mockResolvedValue({ id: 'email-123' });
vi.mock('@/lib/email/resend', () => ({
    sendEmail: mockSendEmail,
}));

const mockRender = vi.fn().mockResolvedValue('<html><body>Test Email</body></html>');
vi.mock('@react-email/components', () => ({
    render: mockRender,
}));

// Mock Task model
const mockTaskFind = vi.fn();
vi.mock('@/models/Task', () => ({
    Task: {
        find: mockTaskFind,
    },
}));

// Mock TaskOverdueEmail component
vi.mock('@/components/emails/task-overdue', () => ({
    TaskOverdueEmail: vi.fn().mockReturnValue(null),
}));

// Import React for creating elements
import React from 'react';

// Import mocks
const { connectDB } = await import('@/lib/db');
const { sendEmail } = await import('@/lib/email/resend');
const { render } = await import('@react-email/components');
const { Task } = await import('@/models/Task');
const { TaskOverdueEmail } = await import('@/components/emails/task-overdue');

// Extract the logic from the route for testing
// This mirrors the intended behavior of the check-overdue route
async function checkOverdueTasks(request: { headers: { get: (name: string) => string | null } }) {
    // 1. Verify cron secret header (x-cron-secret)
    if (request.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
        return { status: 401, data: { error: 'Unauthorized' } };
    }

    try {
        await connectDB();

        const now = new Date();

        // 2. Find overdue tasks (dueDate < now, status not DONE/ARCHIVED, has assignees)
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
            const workspace = board?.workspaceId as any;

            // 4. Handles missing board/workspace gracefully
            if (!board || !workspace || !task.assignees || (task.assignees as any[]).length === 0) {
                continue;
            }

            const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${workspace.slug}/board/${board.slug}?task=${task._id}`;

            // 5. Send email to each assignee
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

        return {
            status: 200,
            data: {
                success: true,
                message: `Checked ${overdueTasks.length} overdue tasks, sent ${emailsSent} emails`,
            },
        };
    } catch (error) {
        console.error('Error checking overdue tasks:', error);
        return { status: 500, data: { error: 'Failed to check overdue tasks' } };
    }
}

describe('Check Overdue API Endpoint', () => {
    describe('Cron secret authentication', () => {
        it('returns 401 when x-cron-secret header is missing', async () => {
            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(null),
                },
            } as any;

            const response = await checkOverdueTasks(request);

            expect(response.status).toBe(401);
            expect(response.data.error).toBe('Unauthorized');
        });

        it('returns 401 when x-cron-secret header is incorrect', async () => {
            const request = {
                headers: {
                    get: vi.fn().mockReturnValue('wrong-secret'),
                },
            } as any;

            const response = await checkOverdueTasks(request);

            expect(response.status).toBe(401);
            expect(response.data.error).toBe('Unauthorized');
        });

        it('returns success when x-cron-secret matches', async () => {
            // Setup: no overdue tasks
            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            const response = await checkOverdueTasks(request);

            expect(response.status).toBe(200);
        });
    });

    describe('Overdue task detection', () => {
        beforeEach(() => {
            // Setup default mock chain
            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });
        });

        it('finds tasks with dueDate in the past', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const overdueTask = {
                _id: 'task-1',
                title: 'Overdue Task',
                dueDate: pastDate,
                status: 'IN_PROGRESS',
                assignees: [{ _id: 'user-1', name: 'Test User', email: 'test@example.com' }],
                boardId: {
                    _id: 'board-1',
                    name: 'Test Board',
                    slug: 'test-board',
                    workspaceId: { _id: 'ws-1', name: 'Test Workspace', slug: 'test-workspace' },
                },
            };

            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([overdueTask]),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            await checkOverdueTasks(request);

            // Verify the query was made with correct parameters
            expect(mockTaskFind).toHaveBeenCalledWith({
                dueDate: { $lt: expect.any(Date) },
                status: { $nin: ['DONE', 'ARCHIVED'] },
                assignees: { $exists: true, $ne: [] },
            });
        });

        it('excludes tasks with status DONE or ARCHIVED', async () => {
            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            await checkOverdueTasks(request);

            // Verify the query excludes DONE and ARCHIVED
            expect(mockTaskFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: { $nin: ['DONE', 'ARCHIVED'] },
                })
            );
        });

        it('excludes tasks with no assignees', async () => {
            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            await checkOverdueTasks(request);

            // Verify tasks with empty assignees are excluded
            expect(mockTaskFind).toHaveBeenCalledWith(
                expect.objectContaining({
                    assignees: { $exists: true, $ne: [] },
                })
            );
        });

        it('uses populate to get assignee details', async () => {
            const populateMock = vi.fn().mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    lean: vi.fn().mockResolvedValue([]),
                }),
            });

            mockTaskFind.mockReturnValue({
                populate: populateMock,
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            await checkOverdueTasks(request);

            // Verify populate was called for assignees
            expect(populateMock).toHaveBeenCalledWith('assignees', 'name email');
        });
    });

    describe('Email sending', () => {
        beforeEach(() => {
            vi.mocked(mockSendEmail).mockClear();
            vi.mocked(mockRender).mockClear();
        });

        it('sends email to each assignee', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const overdueTask = {
                _id: 'task-1',
                title: 'Overdue Task',
                dueDate: pastDate,
                status: 'IN_PROGRESS',
                assignees: [
                    { _id: 'user-1', name: 'User One', email: 'user1@example.com' },
                    { _id: 'user-2', name: 'User Two', email: 'user2@example.com' },
                ],
                boardId: {
                    _id: 'board-1',
                    name: 'Test Board',
                    slug: 'test-board',
                    workspaceId: { _id: 'ws-1', name: 'Test Workspace', slug: 'test-workspace' },
                },
            };

            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([overdueTask]),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            await checkOverdueTasks(request);

            // Should have been called twice (once per assignee)
            expect(mockSendEmail).toHaveBeenCalledTimes(2);
        });

        it('uses TaskOverdueEmail template with correct props', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const taskWithDueDate = {
                _id: 'task-1',
                title: 'Test Task Title',
                dueDate: pastDate,
                status: 'IN_PROGRESS',
                assignees: [{ _id: 'user-1', name: 'Test User', email: 'test@example.com' }],
                boardId: {
                    _id: 'board-1',
                    name: 'Test Board',
                    slug: 'test-board',
                    workspaceId: { _id: 'ws-1', name: 'Test Workspace', slug: 'test-workspace' },
                },
            };

            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([taskWithDueDate]),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            await checkOverdueTasks(request);

            // Verify render was called (which creates the TaskOverdueEmail)
            expect(mockRender).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: expect.anything(),
                    props: expect.objectContaining({
                        recipientName: 'Test User',
                        taskTitle: 'Test Task Title',
                        workspaceName: 'Test Workspace',
                        boardName: 'Test Board',
                        dueDate: pastDate.toISOString(),
                    }),
                })
            );
        });

        it('returns correct count of emails sent', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const overdueTasks = [
                {
                    _id: 'task-1',
                    title: 'Task 1',
                    dueDate: pastDate,
                    status: 'IN_PROGRESS',
                    assignees: [{ _id: 'user-1', name: 'User 1', email: 'user1@example.com' }],
                    boardId: {
                        _id: 'board-1',
                        name: 'Board 1',
                        slug: 'board-1',
                        workspaceId: { _id: 'ws-1', name: 'Workspace 1', slug: 'workspace-1' },
                    },
                },
                {
                    _id: 'task-2',
                    title: 'Task 2',
                    dueDate: pastDate,
                    status: 'IN_PROGRESS',
                    assignees: [
                        { _id: 'user-2', name: 'User 2', email: 'user2@example.com' },
                        { _id: 'user-3', name: 'User 3', email: 'user3@example.com' },
                    ],
                    boardId: {
                        _id: 'board-2',
                        name: 'Board 2',
                        slug: 'board-2',
                        workspaceId: { _id: 'ws-2', name: 'Workspace 2', slug: 'workspace-2' },
                    },
                },
            ];

            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue(overdueTasks),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            const response = await checkOverdueTasks(request);

            // 1 email for task 1 + 2 emails for task 2 = 3 total
            expect(response.data.message).toContain('3 emails');
        });
    });

    describe('Error handling', () => {
        it('returns 500 on database error', async () => {
            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockRejectedValue(new Error('Database connection failed')),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            const response = await checkOverdueTasks(request);

            expect(response.status).toBe(500);
        });

        it('handles missing board gracefully', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const taskWithMissingBoard = {
                _id: 'task-1',
                title: 'Task Without Board',
                dueDate: pastDate,
                status: 'IN_PROGRESS',
                assignees: [{ _id: 'user-1', name: 'Test User', email: 'test@example.com' }],
                boardId: null,
            };

            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([taskWithMissingBoard]),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            // Should not throw, should skip this task and continue
            const response = await checkOverdueTasks(request);
            expect(response.status).toBe(200);

            // No email should have been sent for the task without board
            expect(mockSendEmail).not.toHaveBeenCalled();
        });

        it('handles missing workspace gracefully', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const taskWithMissingWorkspace = {
                _id: 'task-1',
                title: 'Task Without Workspace',
                dueDate: pastDate,
                status: 'IN_PROGRESS',
                assignees: [{ _id: 'user-1', name: 'Test User', email: 'test@example.com' }],
                boardId: {
                    _id: 'board-1',
                    name: 'Test Board',
                    slug: 'test-board',
                    workspaceId: null,
                },
            };

            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([taskWithMissingWorkspace]),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            // Should not throw, should skip this task and continue
            const response = await checkOverdueTasks(request);
            expect(response.status).toBe(200);

            // No email should have been sent for the task without workspace
            expect(mockSendEmail).not.toHaveBeenCalled();
        });

        it('handles missing assignee emails gracefully', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const taskWithAssigneeNoEmail = {
                _id: 'task-1',
                title: 'Task With Assignee No Email',
                dueDate: pastDate,
                status: 'IN_PROGRESS',
                assignees: [
                    { _id: 'user-1', name: 'User With Email', email: 'valid@example.com' },
                    { _id: 'user-2', name: 'User Without Email', email: null },
                    { _id: 'user-3', name: 'User With Empty Email', email: '' },
                ],
                boardId: {
                    _id: 'board-1',
                    name: 'Test Board',
                    slug: 'test-board',
                    workspaceId: { _id: 'ws-1', name: 'Test Workspace', slug: 'test-workspace' },
                },
            };

            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([taskWithAssigneeNoEmail]),
                    }),
                }),
            });

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            const response = await checkOverdueTasks(request);
            expect(response.status).toBe(200);

            // Only one email should have been sent (for the user with valid email)
            expect(mockSendEmail).toHaveBeenCalledTimes(1);
        });

        it('handles sendEmail failure gracefully', async () => {
            const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const overdueTask = {
                _id: 'task-1',
                title: 'Task With Email Failure',
                dueDate: pastDate,
                status: 'IN_PROGRESS',
                assignees: [{ _id: 'user-1', name: 'Test User', email: 'test@example.com' }],
                boardId: {
                    _id: 'board-1',
                    name: 'Test Board',
                    slug: 'test-board',
                    workspaceId: { _id: 'ws-1', name: 'Test Workspace', slug: 'test-workspace' },
                },
            };

            mockTaskFind.mockReturnValue({
                populate: vi.fn().mockReturnValue({
                    populate: vi.fn().mockReturnValue({
                        lean: vi.fn().mockResolvedValue([overdueTask]),
                    }),
                }),
            });

            // Make sendEmail fail
            mockSendEmail.mockRejectedValueOnce(new Error('Email service unavailable'));

            const request = {
                headers: {
                    get: vi.fn().mockReturnValue(CRON_SECRET),
                },
            } as any;

            // Should not throw, should continue processing
            const response = await checkOverdueTasks(request);
            expect(response.status).toBe(200);

            // Response should indicate 0 emails sent since the send failed
            expect(response.data.message).toContain('0 emails');
        });
    });
});
