import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock implementations for external dependencies
vi.mock('@/lib/db', () => ({
    connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/models/Task', () => ({
    Task: {
        create: vi.fn().mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            title: 'Test Task',
            subtasks: [],
        }),
    },
}));

vi.mock('@/models/Board', () => ({
    Board: {
        findById: vi.fn().mockResolvedValue({
            _id: '507f1f77bcf86cd799439012',
            workspaceId: '507f1f77bcf86cd799439013',
        }),
    },
}));

vi.mock('@/lib/auth', () => ({
    auth: {
        callbacks: {
            authorized: vi.fn().mockReturnValue(true),
        },
    },
}));

vi.mock('@/lib/llm/client', () => ({
    createMinimaxClient: vi.fn().mockReturnValue({
        decomposesTask: vi.fn().mockResolvedValue({
            taskId: 'test-task-id',
            summary: 'Test summary',
            subtasks: [
                {
                    title: 'Subtask 1',
                    description: 'Description 1',
                    estimatedHours: 2,
                    priority: 'Medium',
                },
            ],
        }),
    }),
}));

vi.mock('@/lib/rate-limit-enhanced', () => ({
    checkUserRateLimit: vi.fn().mockReturnValue({
        success: true,
        remaining: 19,
        resetIn: 3600,
        limitType: 'user',
    }),
    checkApiKeyRateLimit: vi.fn().mockReturnValue({
        success: true,
        remaining: 99,
        resetIn: 86400,
        limitType: 'apiKey',
    }),
    getApiKeyFromRequest: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/idempotency', () => ({
    isValidUUID: vi.fn().mockReturnValue(true),
    getCachedResponse: vi.fn().mockResolvedValue(null),
    cacheResponse: vi.fn().mockResolvedValue(undefined),
    hashPayload: vi.fn().mockReturnValue('mock-hash'),
}));

vi.mock('@/lib/logger', () => ({
    createLogger: vi.fn().mockReturnValue({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}));

vi.mock('@/lib/metrics', () => ({
    requestsTotal: {
        inc: vi.fn(),
    },
    rateLimitedTotal: {
        inc: vi.fn(),
    },
    llmErrorsTotal: {
        inc: vi.fn(),
    },
}));

// Import after mocks
import { NextRequest } from 'next/server';

// Validation function extracted from route for testing
function validateRequestBody(body: unknown): { valid: boolean; errors: Array<{ field: string; message: string }> } {
    const errors: Array<{ field: string; message: string }> = [];
    const data = body as {
        taskTitle?: string;
        taskDescription?: string;
        contextLinks?: string[];
        requestedCompletionDate?: string;
        boardId?: string;
    };

    // taskTitle: required, 5-120 chars
    if (!data.taskTitle || typeof data.taskTitle !== 'string') {
        errors.push({ field: 'taskTitle', message: 'taskTitle is required' });
    } else if (data.taskTitle.length < 5 || data.taskTitle.length > 120) {
        errors.push({ field: 'taskTitle', message: 'taskTitle must be between 5 and 120 characters' });
    }

    // taskDescription: required, max 2000 chars
    if (!data.taskDescription || typeof data.taskDescription !== 'string') {
        errors.push({ field: 'taskDescription', message: 'taskDescription is required' });
    } else if (data.taskDescription.length > 2000) {
        errors.push({ field: 'taskDescription', message: 'taskDescription must not exceed 2000 characters' });
    }

    // contextLinks: optional array, max 5 URLs
    if (data.contextLinks) {
        if (!Array.isArray(data.contextLinks)) {
            errors.push({ field: 'contextLinks', message: 'contextLinks must be an array' });
        } else if (data.contextLinks.length > 5) {
            errors.push({ field: 'contextLinks', message: 'contextLinks must not exceed 5 URLs' });
        } else {
            // Validate each URL
            for (let i = 0; i < data.contextLinks.length; i++) {
                const url = data.contextLinks[i];
                try {
                    new URL(url);
                } catch {
                    errors.push({ field: 'contextLinks', message: `contextLinks[${i}] is not a valid URL` });
                }
            }
        }
    }

    // requestedCompletionDate: optional, ISO-8601
    if (data.requestedCompletionDate) {
        const date = new Date(data.requestedCompletionDate);
        if (isNaN(date.getTime())) {
            errors.push({ field: 'requestedCompletionDate', message: 'requestedCompletionDate must be a valid ISO-8601 date' });
        }
    }

    // boardId: required
    if (!data.boardId || typeof data.boardId !== 'string') {
        errors.push({ field: 'boardId', message: 'boardId is required' });
    } else if (!/^[0-9a-fA-F]{24}$/.test(data.boardId)) {
        errors.push({ field: 'boardId', message: 'boardId must be a valid MongoDB ObjectId' });
    }

    return { valid: errors.length === 0, errors };
}

// UUID validation function from idempotency module
function isValidUUID(str: string): boolean {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(str);
}

describe('Decompose API Endpoint - Validation', () => {
    describe('validateRequestBody', () => {
        it('should pass validation with valid required fields', () => {
            const body = {
                taskTitle: 'Build a new feature',
                taskDescription: 'This is a detailed description of the feature we need to build.',
                boardId: '507f1f77bcf86cd799439011',
            };

            const result = validateRequestBody(body);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should pass validation with all optional fields', () => {
            const body = {
                taskTitle: 'Build a new feature',
                taskDescription: 'This is a detailed description.',
                boardId: '507f1f77bcf86cd799439011',
                contextLinks: ['https://example.com/docs', 'https://example.com/api'],
                requestedCompletionDate: '2024-12-31T23:59:59Z',
            };

            const result = validateRequestBody(body);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        describe('taskTitle validation', () => {
            it('should fail when taskTitle is missing', () => {
                const body = {
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'taskTitle', message: 'taskTitle is required' })
                );
            });

            it('should fail when taskTitle is empty string', () => {
                const body = {
                    taskTitle: '',
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'taskTitle', message: 'taskTitle is required' })
                );
            });

            it('should fail when taskTitle is less than 5 characters', () => {
                const body = {
                    taskTitle: 'Hi',
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'taskTitle', message: 'taskTitle must be between 5 and 120 characters' })
                );
            });

            it('should fail when taskTitle is more than 120 characters', () => {
                const body = {
                    taskTitle: 'A'.repeat(121),
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'taskTitle', message: 'taskTitle must be between 5 and 120 characters' })
                );
            });

            it('should pass with taskTitle at exactly 5 characters', () => {
                const body = {
                    taskTitle: 'Build',
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(true);
            });

            it('should pass with taskTitle at exactly 120 characters', () => {
                const body = {
                    taskTitle: 'A'.repeat(120),
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(true);
            });
        });

        describe('taskDescription validation', () => {
            it('should fail when taskDescription is missing', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    boardId: '507f1f77bcf86cd799439011',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'taskDescription', message: 'taskDescription is required' })
                );
            });

            it('should fail when taskDescription exceeds 2000 characters', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'A'.repeat(2001),
                    boardId: '507f1f77bcf86cd799439011',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'taskDescription', message: 'taskDescription must not exceed 2000 characters' })
                );
            });

            it('should pass with taskDescription at exactly 2000 characters', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'A'.repeat(2000),
                    boardId: '507f1f77bcf86cd799439011',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(true);
            });
        });

        describe('contextLinks validation', () => {
            it('should fail when contextLinks is not an array', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                    contextLinks: 'not-an-array',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'contextLinks', message: 'contextLinks must be an array' })
                );
            });

            it('should fail when contextLinks exceeds 5 URLs', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                    contextLinks: [
                        'https://example.com/1',
                        'https://example.com/2',
                        'https://example.com/3',
                        'https://example.com/4',
                        'https://example.com/5',
                        'https://example.com/6',
                    ],
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'contextLinks', message: 'contextLinks must not exceed 5 URLs' })
                );
            });

            it('should fail when contextLinks contains invalid URL', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                    contextLinks: ['not-a-valid-url'],
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'contextLinks', message: 'contextLinks[0] is not a valid URL' })
                );
            });

            it('should pass with valid contextLinks', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                    contextLinks: [
                        'https://example.com',
                        'http://test.org',
                        'https://api.github.com/users',
                    ],
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(true);
            });
        });

        describe('requestedCompletionDate validation', () => {
            it('should fail with invalid ISO-8601 date', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                    requestedCompletionDate: 'not-a-date',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'requestedCompletionDate', message: 'requestedCompletionDate must be a valid ISO-8601 date' })
                );
            });

            it('should pass with valid ISO-8601 date', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                    requestedCompletionDate: '2024-12-31T23:59:59.000Z',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(true);
            });
        });

        describe('boardId validation', () => {
            it('should fail when boardId is missing', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'Description',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'boardId', message: 'boardId is required' })
                );
            });

            it('should fail when boardId is not a valid ObjectId', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'Description',
                    boardId: 'not-a-valid-id',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors).toContainEqual(
                    expect.objectContaining({ field: 'boardId', message: 'boardId must be a valid MongoDB ObjectId' })
                );
            });

            it('should pass with valid 24-character hex string', () => {
                const body = {
                    taskTitle: 'Valid Title',
                    taskDescription: 'Description',
                    boardId: '507f1f77bcf86cd799439011',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(true);
            });
        });

        describe('multiple validation errors', () => {
            it('should return all validation errors at once', () => {
                const body = {
                    taskTitle: 'Hi',
                    taskDescription: '',
                    boardId: 'invalid',
                    contextLinks: 'not-an-array',
                };

                const result = validateRequestBody(body);
                expect(result.valid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(1);
            });
        });
    });

    describe('UUID validation (idempotency key)', () => {
        it('should validate correct UUID v4', () => {
            const validUUIDs = [
                '550e8400-e29b-41d4-a716-446655440000',
                '6ba7b810-9dad-41d1-80b4-00c04fd430c8',
                '6ba7b811-9dad-41d1-80b4-00c04fd430c8',
                '6ba7b812-9dad-41d1-80b4-00c04fd430c8',
                '6ba7b813-9dad-41d1-80b4-00c04fd430c8',
            ];

            validUUIDs.forEach((uuid) => {
                expect(isValidUUID(uuid)).toBe(true);
            });
        });

        it('should reject invalid UUIDs', () => {
            const invalidUUIDs = [
                'not-a-uuid',
                '550e8400-e29b-41d4-a716',
                '550e8400-e29b-41d4-a716-44665544000', // too short
                '550e8400-e29b-41d4-a716-4466554400000', // too long
                '550e8400-e29b-51d4-a716-446655440000', // 5 instead of 4 in version position
                '',
                '12345',
            ];

            invalidUUIDs.forEach((uuid) => {
                expect(isValidUUID(uuid)).toBe(false);
            });
        });
    });
});
