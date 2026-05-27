# Workspace Invite Consent Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Existing Flux users must explicitly approve a workspace invitation; pending invites appear on the team page with a "Pending" badge until accepted.

**Architecture:** Add a `requiresAcceptance` flag to `WorkspaceInvite` to distinguish existing-user invites (which need explicit consent) from new-user invites (auto-processed at signup). A new `/join?token=TOKEN` page handles the consent UI. The team page fetches both confirmed members and pending invites and renders them in the same table.

**Tech Stack:** Next.js 15 App Router, Mongoose, NextAuth v5, React Email / Resend, TypeScript strict mode, Vitest

---

## File Map

| Action | File |
|--------|------|
| Modify | `models/WorkspaceInvite.ts` |
| Modify | `lib/process-workspace-invite.ts` |
| Create | `components/emails/workspace-join-invite-email.tsx` |
| Modify | `lib/email/workspace-invite.ts` |
| Modify | `actions/workspace-invite.ts` |
| Create | `app/join/page.tsx` |
| Create | `app/join/join-client.tsx` |
| Create | `components/team/PendingInviteRow.tsx` |
| Modify | `app/[slug]/team/page.tsx` |

---

## Task 1: Add `requiresAcceptance` to WorkspaceInvite model

**Files:**
- Modify: `models/WorkspaceInvite.ts`

- [ ] **Step 1: Update the interface and schema**

Replace the contents of `models/WorkspaceInvite.ts` with:

```typescript
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
  requiresAcceptance: boolean;
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
  requiresAcceptance: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

WorkspaceInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
WorkspaceInviteSchema.index({ email: 1, workspaceId: 1 });

export const WorkspaceInvite = mongoose.models.WorkspaceInvite || mongoose.model<IWorkspaceInvite>('WorkspaceInvite', WorkspaceInviteSchema);
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add models/WorkspaceInvite.ts
git commit -m "feat(model): add requiresAcceptance to WorkspaceInvite"
```

---

## Task 2: Guard auto-processing against existing-user invites

Invites with `requiresAcceptance: true` must never be silently consumed at login or signup — only through the explicit `/join` route.

**Files:**
- Modify: `lib/process-workspace-invite.ts`

- [ ] **Step 1: Add the filter to both find queries**

In `lib/process-workspace-invite.ts`, update **both** `WorkspaceInvite.find(...)` calls to exclude invites that require explicit acceptance. The change is identical in both functions — add `requiresAcceptance: { $ne: true }` to each query:

```typescript
// In processWorkspaceInvites:
const pendingInvites = await WorkspaceInvite.find({
  email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  expiresAt: { $gt: new Date() },
  requiresAcceptance: { $ne: true },
});
```

```typescript
// In addUserToWorkspaceFromInvite:
const pendingInvites = await WorkspaceInvite.find({
  email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  expiresAt: { $gt: new Date() },
  requiresAcceptance: { $ne: true },
});
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/process-workspace-invite.ts
git commit -m "fix(invites): skip requiresAcceptance invites during auto-processing"
```

---

## Task 3: Create join-invite email template and sender

A new email for existing users that links to `/join?token=TOKEN` instead of the signup page.

**Files:**
- Create: `components/emails/workspace-join-invite-email.tsx`
- Modify: `lib/email/workspace-invite.ts`

- [ ] **Step 1: Create the email template**

Create `components/emails/workspace-join-invite-email.tsx`:

```tsx
import * as React from "react";
import { EmailLayout, EHeading, EBody, ECta } from "./email-layout";

interface WorkspaceJoinInviteEmailProps {
  invitedByName: string;
  workspaceName: string;
  joinUrl: string;
}

export function WorkspaceJoinInviteEmail({
  invitedByName,
  workspaceName,
  joinUrl,
}: WorkspaceJoinInviteEmailProps) {
  return (
    <EmailLayout
      previewText={`${invitedByName} invited you to join ${workspaceName} on Flux`}
      variant="default"
    >
      <EHeading>You&apos;ve been invited to {workspaceName}</EHeading>
      <EBody center>
        <strong>{invitedByName}</strong> has invited you to join the{" "}
        <strong>{workspaceName}</strong> workspace. Since you already have a Flux
        account, you can join with one click.
      </EBody>
      <ECta href={joinUrl}>Join {workspaceName}</ECta>
      <p
        style={{
          fontSize: "13px",
          color: "#6b7280",
          textAlign: "center",
          marginTop: "-16px",
        }}
      >
        This invitation expires in 7 days. If you did not expect this invitation,
        you can safely ignore it.
      </p>
    </EmailLayout>
  );
}
```

- [ ] **Step 2: Add the sender to `lib/email/workspace-invite.ts`**

Add this import at the top of `lib/email/workspace-invite.ts`:

```typescript
import { WorkspaceJoinInviteEmail } from '@/components/emails/workspace-join-invite-email';
```

Then add this new exported function after `sendWorkspaceInviteEmail`:

```typescript
export async function sendExistingUserJoinEmail({
  to,
  invitedByName,
  workspaceName,
  inviteToken,
}: {
  to: string;
  invitedByName: string;
  workspaceName: string;
  inviteToken: string;
}) {
  const joinUrl = `${APP_URL}/join?token=${inviteToken}`;
  const html = await render(WorkspaceJoinInviteEmail({ invitedByName, workspaceName, joinUrl }));
  await sendEmail({
    to,
    subject: `You've been invited to join ${workspaceName} on Flux`,
    html,
  });
}
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/emails/workspace-join-invite-email.tsx lib/email/workspace-invite.ts
git commit -m "feat(email): add join-invite email for existing Flux users"
```

---

## Task 4: Rework invite action + add accept and cancel actions

**Files:**
- Modify: `actions/workspace-invite.ts`

- [ ] **Step 1: Import `sendExistingUserJoinEmail` and `Types`**

At the top of `actions/workspace-invite.ts`, add these two imports:

```typescript
import { sendWorkspaceInviteEmail, sendMemberAddedEmail, sendExistingUserJoinEmail } from '@/lib/email/workspace-invite';
import { Types } from 'mongoose';
```

(Replace the existing `sendWorkspaceInviteEmail, sendMemberAddedEmail` import line.)

- [ ] **Step 2: Replace the existing-user branch in `inviteMemberToWorkspace`**

Find the block that starts with `if (user) {` and ends before the `// User doesn't exist` comment. Replace it entirely with:

```typescript
if (user) {
    // Check if already a member
    const isMember = workspace.members.some(
        (m: any) => m.userId.toString() === user._id.toString()
    );
    if (isMember) {
        return { error: 'User is already a member of this workspace' };
    }

    // Check for an existing pending invite
    const existingInvite = await WorkspaceInvite.findOne({
        email: user.email,
        workspaceId: workspace._id,
        expiresAt: { $gt: new Date() },
    });
    if (existingInvite) {
        return { error: 'An invitation has already been sent to this email' };
    }

    // Create consent-gated invite — they must click the join link to be added
    const inviteToken = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await WorkspaceInvite.create({
        email: user.email,
        workspaceId: workspace._id,
        workspaceSlug: workspace.slug,
        workspaceName: workspace.name,
        invitedBy: session.user.id,
        role,
        token: inviteToken,
        expiresAt,
        requiresAcceptance: true,
    });

    await sendExistingUserJoinEmail({
        to: user.email,
        invitedByName: inviterUser?.name || 'A team member',
        workspaceName: workspace.name,
        inviteToken,
    });

    revalidatePath(`/${slug}/team`);
    return { success: true, message: 'Invitation sent! They will receive an email to join the workspace.' };
}
```

- [ ] **Step 3: Add `acceptWorkspaceInvite` server action**

Append this export to the bottom of `actions/workspace-invite.ts`:

```typescript
export async function acceptWorkspaceInvite(token: string): Promise<{ error: string } | { success: true; workspaceSlug: string }> {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return { error: 'Unauthorized' };
    }

    await connectDB();

    const invite = await WorkspaceInvite.findOne({
        token,
        expiresAt: { $gt: new Date() },
    });

    if (!invite) {
        return { error: 'This invite link is invalid or has expired.' };
    }

    if (invite.email !== session.user.email.toLowerCase()) {
        return { error: 'This invite was sent to a different email address.' };
    }

    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) {
        return { error: 'Workspace not found.' };
    }

    const isAlreadyMember = workspace.members.some(
        (m: any) => m.userId.toString() === session.user.id
    );

    if (!isAlreadyMember) {
        workspace.members.push({
            userId: new Types.ObjectId(session.user.id),
            role: invite.role,
            joinedAt: new Date(),
        });
        await workspace.save();
    }

    await WorkspaceInvite.deleteOne({ _id: invite._id });
    revalidatePath(`/${invite.workspaceSlug}/team`);

    return { success: true, workspaceSlug: invite.workspaceSlug };
}
```

- [ ] **Step 4: Add `cancelWorkspaceInvite` server action**

Append this export immediately after `acceptWorkspaceInvite`:

```typescript
export async function cancelWorkspaceInvite(inviteId: string): Promise<{ error: string } | { success: true }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    await connectDB();

    const invite = await WorkspaceInvite.findById(inviteId);
    if (!invite) {
        return { error: 'Invite not found.' };
    }

    const workspace = await Workspace.findById(invite.workspaceId);
    if (!workspace) {
        return { error: 'Workspace not found.' };
    }

    const member = isWorkspaceMember(workspace, session.user.id);
    if (!hasRole(member, 'ADMIN')) {
        return { error: 'Only admins can cancel invitations.' };
    }

    await WorkspaceInvite.deleteOne({ _id: inviteId });
    revalidatePath(`/${invite.workspaceSlug}/team`);

    return { success: true };
}
```

- [ ] **Step 5: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add actions/workspace-invite.ts
git commit -m "feat(invites): consent flow for existing users + accept/cancel actions"
```

---

## Task 5: Create the `/join` accept page

**Files:**
- Create: `app/join/page.tsx`
- Create: `app/join/join-client.tsx`

- [ ] **Step 1: Create the client component `app/join/join-client.tsx`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptWorkspaceInvite } from '@/actions/workspace-invite';

interface JoinClientProps {
  token: string;
  workspaceName: string;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
}

export function JoinClient({ token, workspaceName, role }: JoinClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleJoin = () => {
    startTransition(async () => {
      const result = await acceptWorkspaceInvite(token);
      if ('error' in result) {
        setError(result.error);
      } else {
        router.push(`/${result.workspaceSlug}`);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-md w-full bg-[var(--surface)] rounded-2xl p-8 shadow-lg border border-[var(--border-subtle)] text-center">
        <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[var(--brand-primary)] text-white font-bold text-sm mb-6">
          flux
        </div>
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
          Join {workspaceName}
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mb-6">
          You&apos;ve been invited to join <strong>{workspaceName}</strong> as{' '}
          <strong>{role}</strong>.
        </p>
        {error && (
          <p className="text-sm text-[var(--error-primary)] mb-4 bg-[var(--error-bg)] rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          onClick={handleJoin}
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-[var(--brand-primary)] text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Joining…' : `Join ${workspaceName}`}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the server component `app/join/page.tsx`**

```tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { WorkspaceInvite } from '@/models/WorkspaceInvite';
import { JoinClient } from './join-client';

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="max-w-md w-full bg-[var(--surface)] rounded-2xl p-8 shadow-lg border border-[var(--border-subtle)] text-center">
        <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-[var(--brand-primary)] text-white font-bold text-sm mb-6">
          flux
        </div>
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Invite unavailable</h1>
        <p className="text-[var(--text-secondary)] text-sm">{message}</p>
      </div>
    </div>
  );
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorScreen message="Invalid invite link. Please ask the workspace admin to send a new invitation." />;
  }

  await connectDB();

  const invite = await WorkspaceInvite.findOne({
    token,
    expiresAt: { $gt: new Date() },
  }).lean() as { email: string; workspaceName: string; role: 'VIEWER' | 'EDITOR' | 'ADMIN' } | null;

  if (!invite) {
    return <ErrorScreen message="This invite link is invalid or has expired. Please ask the workspace admin to send a new invitation." />;
  }

  const session = await auth();

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/join?token=${token}`)}`);
  }

  if (session.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <ErrorScreen
        message={`This invite was sent to ${invite.email}. Please sign in with that account to continue.`}
      />
    );
  }

  return (
    <JoinClient
      token={token}
      workspaceName={invite.workspaceName}
      role={invite.role}
    />
  );
}
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/join/page.tsx app/join/join-client.tsx
git commit -m "feat(join): add /join page for existing-user invite acceptance"
```

---

## Task 6: Show pending invites on the team page

**Files:**
- Create: `components/team/PendingInviteRow.tsx`
- Modify: `app/[slug]/team/page.tsx`

- [ ] **Step 1: Create `components/team/PendingInviteRow.tsx`**

```tsx
'use client';

import { useTransition } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cancelWorkspaceInvite } from '@/actions/workspace-invite';

export interface PendingInvite {
  id: string;
  email: string;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
  name?: string;
  image?: string;
}

interface PendingInviteRowProps {
  invite: PendingInvite;
  isAdmin: boolean;
}

export function PendingInviteRow({ invite, isAdmin }: PendingInviteRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!confirm('Cancel this invitation?')) return;
    startTransition(async () => {
      await cancelWorkspaceInvite(invite.id);
    });
  };

  const initials = (invite.name ?? invite.email).charAt(0).toUpperCase();

  return (
    <tr className="hover:bg-[var(--surface)] transition-colors opacity-60">
      <td className="px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          {invite.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={invite.image}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--border-subtle)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {invite.name ?? invite.email}
            </p>
            {invite.name && (
              <p className="text-xs text-[var(--text-secondary)]">{invite.email}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 md:px-6 py-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--background-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          Pending
        </span>
      </td>
      {isAdmin && (
        <td className="px-4 md:px-6 py-4 text-right">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="p-2 text-[var(--error-primary)] hover:bg-[var(--error-bg)] rounded-lg transition-colors disabled:opacity-50"
            title="Cancel invitation"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </td>
      )}
    </tr>
  );
}
```

- [ ] **Step 2: Update `app/[slug]/team/page.tsx` to fetch and render pending invites**

Add these imports at the top of `app/[slug]/team/page.tsx`:

```typescript
import { connectDB } from '@/lib/db';
import { WorkspaceInvite } from '@/models/WorkspaceInvite';
import { User } from '@/models/User';
import { PendingInviteRow, type PendingInvite } from '@/components/team/PendingInviteRow';
```

Then, inside the `TeamPage` async function, after the `workspace` check, add this block to fetch pending invites:

```typescript
// Fetch pending invites for this workspace
await connectDB();
const rawInvites = await WorkspaceInvite.find({ workspaceSlug: slug }).lean();

// Enrich with user data for already-registered invitees
const inviteEmails = rawInvites.map((i: any) => i.email as string);
const matchedUsers = inviteEmails.length > 0
  ? await User.find({ email: { $in: inviteEmails } }).select('email name image').lean()
  : [];
const userByEmail = new Map(matchedUsers.map((u: any) => [u.email as string, u]));

const pendingInvites: PendingInvite[] = rawInvites.map((invite: any) => {
  const matched = userByEmail.get(invite.email as string);
  return {
    id: (invite._id as { toString(): string }).toString(),
    email: invite.email as string,
    role: invite.role as 'VIEWER' | 'EDITOR' | 'ADMIN',
    name: matched?.name as string | undefined,
    image: matched?.image as string | undefined,
  };
});
```

Then, inside the `<tbody>` in the members table, add pending invite rows after the confirmed member rows:

```tsx
<tbody className="divide-y divide-[var(--border-subtle)]">
    {workspace.members.map((member) => (
        <MemberRow
            key={member.userId}
            member={member}
            slug={slug}
            isAdmin={isAdmin}
        />
    ))}
    {pendingInvites.map((invite) => (
        <PendingInviteRow
            key={invite.id}
            invite={invite}
            isAdmin={isAdmin}
        />
    ))}
</tbody>
```

- [ ] **Step 3: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Run production build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add components/team/PendingInviteRow.tsx app/[slug]/team/page.tsx
git commit -m "feat(team): show pending invites on team page with cancel button"
```

---

## Manual Verification Checklist

After all tasks are complete, verify the full flow:

**Existing-user invite flow:**
1. Sign in as Workspace Admin → open Team page → click Invite → enter the email of an existing Flux user
2. Confirm: response message says "Invitation sent!" (not "Member added successfully")
3. Confirm: team page shows the invited user with a "Pending" badge
4. Check the invited user's inbox — email subject should be "You've been invited to join [workspace] on Flux" with a "Join [workspace]" CTA
5. Click the CTA → lands on `/join?token=...` → shows the accept card with workspace name and role
6. Click "Join [workspace]" → redirected to the workspace dashboard
7. Confirm: team page now shows the user as a confirmed member (no longer Pending)

**Email mismatch guard:**
1. While signed in as a different account, visit the `/join?token=...` URL
2. Confirm: error screen says "This invite was sent to [email]…"

**Not-logged-in flow:**
1. Open the join link in a private/incognito window
2. Confirm: redirected to `/login` with `callbackUrl` preserved
3. Sign in → redirected back to `/join` → accept card shown → join works

**Cancel invite:**
1. As admin, open Team page → click the × button on a pending invite row
2. Confirm: the row disappears

**New-user invite flow (regression check):**
1. Invite an email address that has no Flux account
2. Confirm: flow unchanged — invite email with signup link, user added automatically at signup
