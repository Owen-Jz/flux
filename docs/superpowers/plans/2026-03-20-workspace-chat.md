# Workspace Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real-time workspace-wide chat accessible from sidebar using Server-Sent Events (SSE)

**Architecture:** Messages are stored in MongoDB via Mongoose. POST endpoint saves messages and returns them. SSE endpoint streams new messages to connected clients in real-time. Client subscribes to SSE on mount and displays incoming messages.

**Tech Stack:** Next.js App Router, Mongoose, SSE (native), React state

---

## File Structure

```
models/
  ChatMessage.ts              # New: Mongoose model for chat messages
app/api/chat/
  route.ts                   # POST: Send chat message
  stream/route.ts            # GET: SSE endpoint for real-time updates
app/[slug]/chat/
  page.tsx                  # Server component: validates access, renders ChatClient
  ChatClient.tsx             # Client component: SSE subscription, message state, input
components/chat/
  ChatMessageBubble.tsx      # Renders single message with avatar, bubble styling
  ChatInput.tsx             # Textarea + send button with Enter/Shift+Enter handling
actions/
  chat.ts                   # Server actions for chat operations
components/sidebar.tsx      # Add Chat nav item
```

---

## Task 1: Create ChatMessage Model

**Files:**
- Create: `models/ChatMessage.ts`

- [ ] **Step 1: Create the ChatMessage model**

```typescript
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IChatMessage extends Document {
    _id: Types.ObjectId;
    workspaceId: Types.ObjectId;
    userId: Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, maxlength: 2000 },
    },
    { timestamps: true }
);

// Index for efficient querying by workspace + time
ChatMessageSchema.index({ workspaceId: 1, createdAt: -1 });

export const ChatMessage: Model<IChatMessage> =
    mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
```

- [ ] **Step 2: Commit**

```bash
git add models/ChatMessage.ts
git commit -m "feat(chat): add ChatMessage model"
```

---

## Task 2: Create SSE Stream Endpoint

**Files:**
- Create: `app/api/chat/stream/route.ts`

- [ ] **Step 1: Create SSE stream endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Workspace } from '@/models/Workspace';
import { ChatMessage } from '@/models/ChatMessage';

// In-memory connection registry (workspaceSlug -> Set of controllers)
// For single-instance; replace with Redis pub/sub for multi-instance
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceSlug = searchParams.get('workspaceSlug');

    if (!workspaceSlug) {
        return new NextResponse('Missing workspaceSlug', { status: 400 });
    }

    await connectDB();

    // Verify user is a member of the workspace
    const workspace = await Workspace.findOne({ slug: workspaceSlug });
    if (!workspace) {
        return new NextResponse('Workspace not found', { status: 404 });
    }

    const isMember = workspace.members.some(
        (m: { userId: { toString: () => string } }) =>
            m.userId.toString() === session.user.id
    );

    if (!isMember) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    // Create SSE stream
    const stream = new ReadableStream({
        start(controller) {
            // Register this connection
            if (!connections.has(workspaceSlug)) {
                connections.set(workspaceSlug, new Set());
            }
            connections.get(workspaceSlug)!.add(controller);

            // Send initial connection event
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
        },
        cancel() {
            // Remove connection on client disconnect
            const workspaceConnections = connections.get(workspaceSlug);
            if (workspaceConnections) {
                for (const controller of workspaceConnections) {
                    if (controller === this) {
                        workspaceConnections.delete(controller);
                        break;
                    }
                }
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

// Export function to broadcast messages to all connections in a workspace
export function broadcastToWorkspace(workspaceSlug: string, message: object) {
    const workspaceConnections = connections.get(workspaceSlug);
    if (workspaceConnections) {
        const encoder = new TextEncoder();
        const data = `data: ${JSON.stringify({ type: 'message', data: message })}\n\n`;
        for (const controller of workspaceConnections) {
            try {
                controller.enqueue(encoder.encode(data));
            } catch {
                // Connection closed, remove it
                workspaceConnections.delete(controller);
            }
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/chat/stream/route.ts
git commit -m "feat(chat): add SSE stream endpoint for real-time messages"
```

---

## Task 3: Create POST Chat API Route

**Files:**
- Create: `app/api/chat/route.ts`

- [ ] **Step 1: Create POST chat route**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Workspace } from '@/models/Workspace';
import { ChatMessage } from '@/models/ChatMessage';
import { User } from '@/models/User';
import { broadcastToWorkspace } from '../stream/route';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { workspaceSlug, content } = await request.json();

        if (!workspaceSlug || !content) {
            return NextResponse.json(
                { error: 'Missing workspaceSlug or content' },
                { status: 400 }
            );
        }

        if (typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json(
                { error: 'Content cannot be empty' },
                { status: 400 }
            );
        }

        if (content.length > 2000) {
            return NextResponse.json(
                { error: 'Content exceeds 2000 characters' },
                { status: 400 }
            );
        }

        await connectDB();

        // Verify user is a member of the workspace
        const workspace = await Workspace.findOne({ slug: workspaceSlug });
        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        const isMember = workspace.members.some(
            (m: { userId: { toString: () => string } }) =>
                m.userId.toString() === session.user.id
        );

        if (!isMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Create the message
        const message = await ChatMessage.create({
            workspaceId: workspace._id,
            userId: session.user.id,
            content: content.trim(),
        });

        // Populate user info for broadcast
        const populatedMessage = await ChatMessage.findById(message._id)
            .populate('userId', 'name image')
            .lean();

        const responseMessage = {
            id: populatedMessage!._id.toString(),
            content: populatedMessage!.content,
            createdAt: populatedMessage!.createdAt.toISOString(),
            user: {
                id: (populatedMessage!.userId as { _id: { toString: () => string }; name: string; image?: string })._id.toString(),
                name: (populatedMessage!.userId as { name: string; image?: string }).name,
                image: (populatedMessage!.userId as { image?: string }).image,
            },
        };

        // Broadcast to all connected clients
        broadcastToWorkspace(workspaceSlug, responseMessage);

        return NextResponse.json(responseMessage, { status: 201 });
    } catch (error) {
        console.error('Chat POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat(chat): add POST endpoint for sending chat messages"
```

---

## Task 4: Create Chat Components

**Files:**
- Create: `components/chat/ChatMessageBubble.tsx`
- Create: `components/chat/ChatInput.tsx`

- [ ] **Step 1: Create ChatMessageBubble component**

```typescript
'use client';

import { MessageSquareIcon } from '@heroicons/react/24/outline';

interface ChatMessage {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        image?: string;
    };
}

interface ChatMessageBubbleProps {
    message: ChatMessage;
    isOwn: boolean;
}

function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatMessageBubble({ message, isOwn }: ChatMessageBubbleProps) {
    return (
        <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            {message.user.image ? (
                <img
                    src={message.user.image}
                    alt={message.user.name}
                    className="w-9 h-9 rounded-full flex-shrink-0"
                    referrerPolicy="no-referrer"
                />
            ) : (
                <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {message.user.name?.charAt(0) || '?'}
                </div>
            )}

            {/* Message content */}
            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                {/* Name + time */}
                {!isOwn && (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {message.user.name}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                            {formatTime(message.createdAt)}
                        </span>
                    </div>
                )}

                {/* Message bubble */}
                <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isOwn
                            ? 'bg-[var(--brand-primary)] text-white rounded-br-md'
                            : 'bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-bl-md'
                    }`}
                >
                    {message.content}
                </div>

                {/* Time for own messages */}
                {isOwn && (
                    <span className="text-xs text-[var(--text-tertiary)] mt-1">
                        {formatTime(message.createdAt)}
                    </span>
                )}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Create ChatInput component**

```typescript
'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface ChatInputProps {
    onSend: (content: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        const trimmed = content.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setContent('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        // Auto-resize up to ~3 lines
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
        }
    };

    return (
        <div className="flex items-end gap-3 p-4 border-t border-[var(--border-subtle)] bg-[var(--surface)]">
            <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={disabled}
                rows={1}
                className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] resize-none focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all disabled:opacity-50"
                style={{ maxHeight: '80px' }}
            />
            <button
                onClick={handleSend}
                disabled={!content.trim() || disabled}
                className="p-3 rounded-xl bg-[var(--brand-primary)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--brand-primary-hover)] transition-colors flex-shrink-0"
            >
                <PaperAirplaneIcon className="w-5 h-5" />
            </button>
        </div>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/chat/ChatMessageBubble.tsx components/chat/ChatInput.tsx
git commit -m "feat(chat): add ChatMessageBubble and ChatInput components"
```

---

## Task 5: Create ChatClient Component

**Files:**
- Create: `app/[slug]/chat/ChatClient.tsx`

- [ ] **Step 1: Create ChatClient component with SSE subscription**

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface ChatMessage {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        image?: string;
    };
}

interface ChatClientProps {
    currentUserId: string;
}

export function ChatClient({ currentUserId }: ChatClientProps) {
    const params = useParams();
    const workspaceSlug = params.slug as string;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // SSE connection
    useEffect(() => {
        const connect = () => {
            const eventSource = new EventSource(`/api/chat/stream?workspaceSlug=${workspaceSlug}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                setIsConnected(true);
            };

            eventSource.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'connected') {
                        setIsConnected(true);
                    } else if (payload.type === 'message') {
                        setMessages((prev) => [...prev, payload.data]);
                    }
                } catch {
                    console.error('Failed to parse SSE message');
                }
            };

            eventSource.onerror = () => {
                setIsConnected(false);
                eventSource.close();
                // Reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 3000);
            };
        };

        connect();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [workspaceSlug]);

    const handleSend = async (content: string) => {
        if (isSending) return;
        setIsSending(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspaceSlug, content }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--background-subtle)] flex items-center justify-center mb-4">
                            <ChatBubbleLeftRightIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                            No messages yet
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                            Start the conversation! Messages you send will appear here in real-time.
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => (
                            <ChatMessageBubble
                                key={message.id}
                                message={message}
                                isOwn={message.user.id === currentUserId}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Connection status indicator */}
            {!isConnected && (
                <div className="px-4 py-2 bg-amber-50 text-amber-700 text-sm text-center">
                    Reconnecting...
                </div>
            )}

            {/* Input area */}
            <ChatInput onSend={handleSend} disabled={isSending} />
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[slug]/chat/ChatClient.tsx
git commit -m "feat(chat): add ChatClient with SSE subscription"
```

---

## Task 6: Create Chat Page

**Files:**
- Create: `app/[slug]/chat/page.tsx`

- [ ] **Step 1: Create Chat page (server component)**

```typescript
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getWorkspaceBySlug } from '@/actions/workspace';
import { ChatClient } from './ChatClient';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default async function ChatPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const session = await auth();
    const { slug } = await params;

    if (!session?.user) {
        redirect('/login');
    }

    const workspace = await getWorkspaceBySlug(slug);
    if (!workspace) {
        redirect('/dashboard');
    }

    // Check if user is a member
    const isMember = workspace.members.some(
        (m: { userId: string }) => m.userId === session.user.id
    );

    if (!isMember && !workspace.publicAccess) {
        redirect('/dashboard');
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface)]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">
                            Team Chat
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat client */}
            <div className="flex-1 overflow-hidden">
                <ChatClient currentUserId={session.user.id} />
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[slug]/chat/page.tsx
git commit -m "feat(chat): add workspace chat page"
```

---

## Task 7: Add Chat to Sidebar Navigation

**Files:**
- Modify: `components/sidebar.tsx:61-92`

- [ ] **Step 1: Add Chat to sidebar nav items**

Find the `navItems` array in `Sidebar` component (around line 61) and add:

```typescript
{
    href: currentWorkspace ? `/${currentWorkspace.slug}/chat` : '/dashboard',
    label: 'Chat',
    icon: ChatBubbleLeftRightIcon,
    show: true,
},
```

Import `ChatBubbleLeftRightIcon` from `@heroicons/react/24/outline`.

- [ ] **Step 2: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat(chat): add Chat nav item to sidebar"
```

---

## Verification

After implementing all tasks:

1. Start the dev server: `npm run dev`
2. Navigate to any workspace
3. Click "Chat" in the sidebar
4. Send a message — it should appear instantly
5. Open the same workspace in another browser/tab
6. Send a message from one — it should appear in the other in real-time
7. Refresh the page — messages persist (data stored in MongoDB)
