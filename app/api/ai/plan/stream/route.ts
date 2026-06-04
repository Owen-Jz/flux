// app/api/ai/plan/stream/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Types } from 'mongoose';
import { Board } from '@/models/Board';
import { Workspace } from '@/models/Workspace';
import { Task } from '@/models/Task';
import { isWorkspaceMember, hasRole } from '@/lib/workspace-utils';
import { createMinimaxClient } from '@/lib/llm/client';
import { checkUserRateLimit } from '@/lib/rate-limit-enhanced';
import { revalidatePath } from 'next/cache';
import { normalizeSectionTask } from '@/lib/llm/board-stream-planner';
import { sanitizeContextLinks } from '@/lib/llm/sanitize';
import type { BoardStreamRequest, PlanStreamEvent, StreamedTask } from '@/types/ai-plan';

const SECTION_CONCURRENCY = 3;
const DEFAULT_MAX_TASKS = 10;

function sse(event: PlanStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rateLimit = checkUserRateLimit(session.user.id);
  if (!rateLimit.success) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: BoardStreamRequest;
  try {
    body = (await request.json()) as BoardStreamRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { description, boardId, boardSlug, workspaceSlug, deadline, contextLinks, maxTasks } = body;

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return new Response(JSON.stringify({ error: 'description must be at least 10 characters' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (description.trim().length > 5000) {
    return new Response(JSON.stringify({ error: 'description must not exceed 5000 characters' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!workspaceSlug || !boardSlug) {
    return new Response(JSON.stringify({ error: 'workspaceSlug and boardSlug are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!boardId || !Types.ObjectId.isValid(boardId)) {
    return new Response(JSON.stringify({ error: 'A valid boardId is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await connectDB();

  const workspace = await Workspace.findOne({ slug: workspaceSlug });
  if (!workspace) {
    return new Response(JSON.stringify({ error: 'Workspace not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }
  const member = isWorkspaceMember(workspace, session.user.id);
  if (!hasRole(member, 'ADMIN', 'EDITOR')) {
    return new Response(JSON.stringify({ error: 'Permission denied' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }
  const board = await Board.findOne({ _id: boardId, workspaceId: workspace._id }).select('_id');
  if (!board) {
    return new Response(JSON.stringify({ error: 'Board not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  const workspaceId = workspace._id as Types.ObjectId;
  const boardObjectId = board._id as Types.ObjectId;
  const cap = typeof maxTasks === 'number' && maxTasks > 0 ? Math.min(maxTasks, 30) : DEFAULT_MAX_TASKS;
  const safeLinks = sanitizeContextLinks(contextLinks);
  // Only forward a deadline that is a short string — it flows into the LLM prompt.
  const safeDeadline =
    typeof deadline === 'string' && deadline.trim().length > 0 && deadline.length <= 50
      ? deadline
      : undefined;

  const encoder = new TextEncoder();
  const baseOrder = Date.now();
  let orderCounter = 0;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: PlanStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(sse(event)));
        } catch {
          /* client disconnected — controller already closed/cancelled */
        }
      };
      const aborted = () => request.signal.aborted;

      const createdTaskIds: string[] = [];
      const columnTotals: Record<string, number> = {};

      try {
        const client = createMinimaxClient();

        // Phase 1: skeleton
        const skeleton = await client.planSkeleton({
          description: description.trim(),
          deadline: safeDeadline,
          contextLinks: safeLinks,
          maxTasks: cap,
        });
        send({
          type: 'skeleton',
          title: skeleton.title,
          summary: skeleton.summary,
          sections: skeleton.sections.map(s => ({ name: s.name, description: s.description })),
        });

        const sections = skeleton.sections;
        const perSectionCap = Math.max(2, Math.ceil(cap / sections.length));

        // Phase 2: per-section generation with bounded concurrency
        const worker = async (index: number): Promise<void> => {
          if (aborted()) return;
          try {
            const result = await client.planSection({
              description: description.trim(),
              section: sections[index],
              allSections: sections,
              maxTasksForSection: perSectionCap,
              deadline: safeDeadline,
            });

            // Don't write tasks for a plan the user already cancelled.
            if (aborted()) return;

            const normalized = result.tasks.map(normalizeSectionTask);
            // Reserve this section's order range atomically (synchronous — no
            // await between read and advance, so concurrent workers can't overlap).
            const startOrder = orderCounter;
            orderCounter += normalized.length;
            const docs = normalized.map((t, i) => ({
              workspaceId,
              boardId: boardObjectId,
              title: t.title,
              description: t.description,
              status: t.status,
              priority: t.priority,
              estimatedHours: t.estimatedHours,
              order: baseOrder + startOrder + i,
            }));

            const inserted = await Task.insertMany(docs);

            const streamed: StreamedTask[] = inserted.map((doc, i) => {
              const id = (doc._id as Types.ObjectId).toString();
              createdTaskIds.push(id);
              columnTotals[normalized[i].status] = (columnTotals[normalized[i].status] ?? 0) + 1;
              return {
                id,
                title: normalized[i].title,
                description: normalized[i].description,
                status: normalized[i].status,
                priority: normalized[i].priority,
                estimatedHours: normalized[i].estimatedHours,
                order: docs[i].order,
                sectionIndex: index,
              };
            });

            send({ type: 'section', sectionIndex: index, tasks: streamed });
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Section failed';
            send({ type: 'section_error', sectionIndex: index, message });
          }
        };

        // Concurrency pool: each runner pulls the next section index
        let cursor = 0;
        const runner = async (): Promise<void> => {
          while (!aborted()) {
            const i = cursor++;
            if (i >= sections.length) return;
            await worker(i);
          }
        };
        const poolSize = Math.min(SECTION_CONCURRENCY, sections.length);
        await Promise.all(Array.from({ length: poolSize }, () => runner()));

        if (createdTaskIds.length > 0) {
          revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
        }

        send({
          type: 'done',
          taskIds: createdTaskIds,
          columnTotals,
          tasksCreated: createdTaskIds.length,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Planning failed';
        console.error('[ai/plan/stream] error:', message);
        const friendly = message.includes('timed out')
          ? 'Request timed out — please try again'
          : 'Planning failed — please try again';
        // Surface what was created so the client can still offer Undo
        if (createdTaskIds.length > 0) {
          // Revalidate here too — tasks were inserted before the failure, and
          // without this other members won't see them until the cache expires.
          revalidatePath(`/${workspaceSlug}/board/${boardSlug}`);
          send({ type: 'done', taskIds: createdTaskIds, columnTotals, tasksCreated: createdTaskIds.length });
        } else {
          send({ type: 'error', message: friendly });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed/cancelled */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
