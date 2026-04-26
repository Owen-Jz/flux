import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';

import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { Board } from '@/models/Board';
import { Workspace } from '@/models/Workspace';
import { auth } from '@/lib/auth';
import { createMinimaxClient } from '@/lib/llm/client';
import {
    checkUserRateLimit,
    checkApiKeyRateLimit,
    getApiKeyFromRequest,
    EnhancedRateLimitResult
} from '@/lib/rate-limit-enhanced';
import { isValidUUID, getCachedResponse, cacheResponse, hashPayload } from '@/lib/idempotency';
import { createLogger } from '@/lib/logger';
import { requestsTotal, rateLimitedTotal, llmErrorsTotal } from '@/lib/metrics';

interface DecomposeRequestBody {
    taskTitle: string;
    taskDescription: string;
    contextLinks?: string[];
    requestedCompletionDate?: string;
    maxSubtasks?: number;
    boardId: string;
}

interface ValidationError {
    field: string;
    message: string;
}

/**
 * Validate the request body
 */
function validateRequestBody(body: unknown): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    const data = body as DecomposeRequestBody;

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

    // maxSubtasks: optional, number between 1 and 20
    if (data.maxSubtasks !== undefined) {
        if (typeof data.maxSubtasks !== 'number' || !Number.isInteger(data.maxSubtasks)) {
            errors.push({ field: 'maxSubtasks', message: 'maxSubtasks must be an integer' });
        } else if (data.maxSubtasks < 1 || data.maxSubtasks > 20) {
            errors.push({ field: 'maxSubtasks', message: 'maxSubtasks must be between 1 and 20' });
        }
    }

    // boardId: required
    if (!data.boardId || typeof data.boardId !== 'string') {
        errors.push({ field: 'boardId', message: 'boardId is required' });
    } else if (!Types.ObjectId.isValid(data.boardId)) {
        errors.push({ field: 'boardId', message: 'boardId must be a valid MongoDB ObjectId' });
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Update Prometheus metrics
 */
function updateMetrics(method: string, endpoint: string, status: number): void {
    requestsTotal.inc({ method, endpoint, status });
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    const method = 'POST';
    const endpoint = '/api/v1/tasks/decompose';

    // Extract idempotency key
    const idempotencyKey = request.headers.get('X-Idempotency-Key');

    // Get session for authentication
    const session = await auth();

    // Extract API key if provided
    const apiKey = getApiKeyFromRequest(request);

    // Determine user ID (from session or use 'anonymous' for metrics)
    const userId = session?.user?.id || 'anonymous';

    // Create logger with context
    const logger = createLogger({
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
        userId,
        action: 'decompose_task',
    });

    // If API key is provided, check API key rate limit
    if (apiKey) {
        const apiKeyResult = checkApiKeyRateLimit(apiKey);
        if (!apiKeyResult.success) {
            logger.warn('API key rate limit exceeded', { limitType: 'apiKey', limit: 100, window: '24h' });
            rateLimitedTotal.inc({ user_id: userId, limit_type: 'apiKey' });
            updateMetrics(method, endpoint, 429);
            return NextResponse.json(
                { error: 'API key rate limit exceeded. Limit: 100 requests per 24 hours' },
                { status: 429 }
            );
        }
    }

    // Check user rate limit (20/hour)
    const userRateLimitResult: EnhancedRateLimitResult = checkUserRateLimit(userId);
    if (!userRateLimitResult.success) {
        logger.warn('User rate limit exceeded', { limitType: 'user', limit: 20, window: '1h' });
        rateLimitedTotal.inc({ user_id: userId, limit_type: 'user' });
        updateMetrics(method, endpoint, 429);
        return NextResponse.json(
            { error: 'User rate limit exceeded. Limit: 20 requests per hour' },
            { status: 429 }
        );
    }

    // Check authentication - require session for now
    if (!session?.user) {
        logger.warn('Unauthorized request', { userId });
        updateMetrics(method, endpoint, 401);
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    // Parse and validate request body
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        updateMetrics(method, endpoint, 400);
        return NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
        );
    }

    const validation = validateRequestBody(body);
    if (!validation.valid) {
        logger.warn('Validation failed', { errors: validation.errors });
        updateMetrics(method, endpoint, 400);
        return NextResponse.json(
            { error: 'Validation failed', details: validation.errors },
            { status: 400 }
        );
    }

    const data = body as DecomposeRequestBody;

    // Validate idempotency key if provided
    if (idempotencyKey && !isValidUUID(idempotencyKey)) {
        logger.warn('Invalid idempotency key', { idempotencyKey });
        updateMetrics(method, endpoint, 400);
        return NextResponse.json(
            { error: 'X-Idempotency-Key must be a valid UUID v4' },
            { status: 400 }
        );
    }

    // Check for cached response if idempotency key provided
    if (idempotencyKey) {
        const cachedResponse = await getCachedResponse(idempotencyKey, userId);
        if (cachedResponse) {
            logger.info('Returning cached response', { idempotencyKey, duration_ms: Date.now() - startTime });
            updateMetrics(method, endpoint, 200);
            return NextResponse.json(cachedResponse);
        }
    }

    // Connect to database
    try {
        await connectDB();
    } catch (error) {
        logger.error('Database connection failed', { error: error instanceof Error ? error.message : String(error) });
        updateMetrics(method, endpoint, 500);
        return NextResponse.json(
            { error: 'Database connection failed' },
            { status: 500 }
        );
    }

    // Validate board exists and user has access
    try {
        const board = await Board.findById(data.boardId);
        if (!board) {
            logger.warn('Board not found', { boardId: data.boardId });
            updateMetrics(method, endpoint, 404);
            return NextResponse.json(
                { error: 'Board not found' },
                { status: 404 }
            );
        }

        // Verify user is a member of the workspace (horizontal privilege escalation fix)
        const workspace = await Workspace.findOne({ _id: board.workspaceId, 'members.userId': session.user.id });
        if (!workspace) {
            logger.warn('User not a member of workspace', { boardId: data.boardId, userId: session.user.id });
            updateMetrics(method, endpoint, 403);
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }
    } catch (error) {
        logger.error('Error validating board', { error: error instanceof Error ? error.message : String(error) });
        updateMetrics(method, endpoint, 500);
        return NextResponse.json(
            { error: 'Error validating board' },
            { status: 500 }
        );
    }

    // Create LLM client and decompose task
    let llmResponse: {
        taskId: string;
        summary: string;
        subtasks: Array<{
            title: string;
            description: string;
            estimatedHours: number;
            priority: string;
            referenceUrls?: string[];
        }>;
    };

    try {
        const minimaxClient = createMinimaxClient();

        const decomposeRequest = {
            taskTitle: data.taskTitle,
            taskDescription: data.taskDescription,
            contextLinks: data.contextLinks,
            requestedCompletionDate: data.requestedCompletionDate,
            maxSubtasks: data.maxSubtasks,
        };

        llmResponse = await minimaxClient.decomposesTask(decomposeRequest);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('LLM request failed', { error: errorMessage });

        // Check for timeout
        if (errorMessage.includes('timed out')) {
            llmErrorsTotal.inc({ error_type: 'timeout' });
            updateMetrics(method, endpoint, 504);
            return NextResponse.json(
                { error: 'LLM request timed out. Please try again.' },
                { status: 504 }
            );
        }

        // Other LLM errors
        llmErrorsTotal.inc({ error_type: 'other' });
        updateMetrics(method, endpoint, 502);
        return NextResponse.json(
            { error: 'LLM request failed', details: errorMessage },
            { status: 502 }
        );
    }

    // Save decomposed tasks to MongoDB
    try {
        const boardObjectId = new Types.ObjectId(data.boardId);

        // Get the board to find workspaceId
        const board = await Board.findById(data.boardId);
        if (!board) {
            throw new Error('Board not found');
        }

        // Create the parent task
        const parentTask = await Task.create({
            workspaceId: board.workspaceId,
            boardId: boardObjectId,
            title: data.taskTitle,
            description: data.taskDescription,
            status: 'BACKLOG',
            priority: 'MEDIUM',
            order: 0,
            summary: llmResponse.summary,
            referenceUrls: data.contextLinks,
            requestedCompletionDate: data.requestedCompletionDate ? new Date(data.requestedCompletionDate) : undefined,
            isDecomposedTask: true,
            subtasks: llmResponse.subtasks.map((subtask) => ({
                title: subtask.title,
                completed: false,
            })),
        });

        // Create subtasks as separate tasks
        const subtaskPromises = llmResponse.subtasks.map(async (subtask, index) => {
            return Task.create({
                workspaceId: board.workspaceId,
                boardId: boardObjectId,
                title: subtask.title,
                description: subtask.description,
                status: 'BACKLOG',
                priority: subtask.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
                order: index,
                parentTaskId: parentTask._id,
                referenceUrls: subtask.referenceUrls,
                requestedCompletionDate: data.requestedCompletionDate ? new Date(data.requestedCompletionDate) : undefined,
                isDecomposedTask: false,
                subtasks: [],
            });
        });

        await Promise.all(subtaskPromises);

        // Prepare response
        const responseData = {
            taskId: parentTask._id.toString(),
            summary: llmResponse.summary,
            subtasks: llmResponse.subtasks,
        };

        // Cache response if idempotency key provided
        if (idempotencyKey) {
            const requestHash = hashPayload(data);
            await cacheResponse(idempotencyKey, userId, requestHash, responseData);
        }

        const durationMs = Date.now() - startTime;
        logger.info('Task decomposed successfully', {
            taskId: parentTask._id.toString(),
            subtaskCount: llmResponse.subtasks.length,
            duration_ms: durationMs,
        });

        updateMetrics(method, endpoint, 200);
        return NextResponse.json(responseData);
    } catch (error) {
        logger.error('Failed to save decomposed task', { error: error instanceof Error ? error.message : String(error) });
        updateMetrics(method, endpoint, 500);
        return NextResponse.json(
            { error: 'Failed to save decomposed task' },
            { status: 500 }
        );
    }
}
