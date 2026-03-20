# Workspace Chat — Design Spec

## Overview

A real-time workspace-wide chat where team members can send instant messages to each other. The chat is accessible from the workspace sidebar as a first-class navigation item.

## Architecture

### Data Model

New collection: `ChatMessage`

```typescript
interface IChatMessage {
  _id: ObjectId;
  workspaceId: ObjectId;    // References Workspace
  userId: ObjectId;         // References User
  content: string;           // Message text (max 2000 chars)
  createdAt: Date;
  updatedAt: Date;
}
```

### API Design

**POST `/api/chat`**
- Purpose: Send a new chat message
- Auth: Requires session, must be workspace member
- Body: `{ workspaceSlug: string, content: string }`
- Response: `{ id: string, content: string, createdAt: string, user: { id, name, image } }`
- Broadcasts via SSE to all connected clients in the workspace

**GET `/api/chat/stream`**
- Purpose: SSE endpoint for real-time message streaming
- Auth: Requires session, must be workspace member
- Query params: `?workspaceSlug=<slug>`
- Response: SSE stream
- Event format: `data: { type: 'message', data: ChatMessage }`

### SSE Implementation

- Uses Next.js App Router `Request`/`Response` pattern
- Each client gets an SSE connection tied to their workspace
- Messages are broadcast to all clients when POST is called
- Simple in-memory connection tracking (works for single-instance; Redis pub/sub for scale later)

## UI Components

### Sidebar Integration

Add to sidebar navigation:
```typescript
{
  href: `/${currentWorkspace.slug}/chat`,
  label: 'Chat',
  icon: ChatBubbleLeftRightIcon,
  show: true,
}
```

### Chat Page (`app/[slug]/chat/page.tsx`)

**Layout:**
- Full-page chat view (similar to Issues/Analytics pages)
- Header with workspace chat title + member count indicator
- Message area (scrollable, newest at bottom)
- Input area fixed at bottom

**Visual Design:**
- Message bubbles: sender's messages aligned right (brand primary bg), others aligned left (surface bg)
- Avatar + name + timestamp above each message
- Input: textarea with send button, auto-resize up to 3 lines
- Empty state: "No messages yet. Start the conversation!"

### Components

**`ChatMessageBubble`** — Renders a single message
- Props: `message`, `isOwn`
- Layout: Avatar | Name + content + time (or content + time for own)

**`ChatInput`** — Message composition
- Textarea with placeholder "Type a message..."
- Send button (disabled when empty)
- Submit on Enter (Shift+Enter for newline)

**`ChatPage`** — Server component
- Fetches workspace and validates access
- Renders ChatClient

**`ChatClient`** — Client component
- Manages SSE connection
- Handles message state
- Optimistic message display on send

## User Flow

1. User clicks "Chat" in sidebar
2. Navigates to `/{workspaceSlug}/chat`
3. SSE connection established for real-time updates
4. User types message and sends
5. Message POSTed to API, broadcast via SSE
6. All connected clients receive message and update UI instantly

## Technical Approach

### File Structure

```
app/[slug]/chat/
  page.tsx              # Server component
  ChatClient.tsx        # Client component with SSE
components/chat/
  ChatMessageBubble.tsx
  ChatInput.tsx
models/
  ChatMessage.ts
actions/
  chat.ts               # Server actions
app/api/chat/
  route.ts              # POST handler
  stream/route.ts       # SSE endpoint
```

### Database Index

```javascript
ChatMessageSchema.index({ workspaceId: 1, createdAt: -1 });
```

### Error Handling

- Invalid workspace slug → 404
- User not authorized → 401
- Empty content → 400
- SSE connection lost → client auto-reconnects after 3s

## Security

- All messages require authentication
- Users can only access chat for workspaces they belong to
- Content sanitized on display (XSS prevention via React)
- Rate limiting: max 10 messages per minute per user (future)

## Future Enhancements (Out of Scope for MVP)

- Message history with pagination
- Typing indicators
- Online/offline presence
- @mentions with notifications
- Message reactions
- Edit/delete own messages
- Redis pub/sub for multi-instance scaling
