# Workspace Invite Consent Flow

**Date:** 2026-05-27
**Status:** Approved

## Problem

When an admin invites an existing Flux user to a workspace, that user is silently added to `workspace.members` with no consent step. They receive a "you were added" notification email but have no way to approve or decline. Additionally, pending invites (for both existing and new users) are invisible on the team page — admins cannot see who they have invited but who has not yet joined.

## Goal

1. Existing users must explicitly approve a workspace invitation before being added.
2. All pending invites appear on the team page with a "Pending" badge until accepted.
3. Admins can cancel a pending invite from the team page.
4. Once accepted, the workspace is immediately available for switching in the user's workspace list.

---

## Architecture

### Data Model Change — `WorkspaceInvite`

Add one field to the existing schema:

```ts
requiresAcceptance: { type: Boolean, default: false }
```

- `false` (default) — invite was sent to a **new user** (no account). Auto-processed at signup via `addUserToWorkspaceFromInvite`. Behaviour unchanged.
- `true` — invite was sent to an **existing user**. Must be accepted via the `/join` route. Skipped by auto-processing at login.

No other schema changes are needed. The existing TTL index (7-day expiry) applies to both types.

---

## Changed Files

### 1. `models/WorkspaceInvite.ts`
Add `requiresAcceptance: Boolean` field (default `false`).

### 2. `actions/workspace-invite.ts` — existing-user branch

**Before:** Add user directly to `workspace.members`, send "member added" email.

**After:**
- Create a `WorkspaceInvite` record with `requiresAcceptance: true`.
- Send a new **"join invitation"** email (see below) whose CTA points to `/join?token=TOKEN`.
- Do NOT touch `workspace.members`.
- Return message: `"Invitation sent! They will receive an email to join the workspace."`

Also add two new exports to this file:
- `acceptWorkspaceInvite(token: string)` — validates token, adds user to workspace, deletes invite, revalidates team page. Returns `{ workspaceSlug }` on success.
- `cancelWorkspaceInvite(inviteId: string)` — admin-only, deletes invite record, revalidates team page.

### 3. `lib/process-workspace-invite.ts`

In `addUserToWorkspaceFromInvite`, filter the invite query to only process invites where `requiresAcceptance` is `false` (or field absent):

```ts
WorkspaceInvite.find({ email, requiresAcceptance: { $ne: true } })
```

This prevents existing-user invites from being silently accepted at login.

### 4. `components/emails/workspace-join-invite-email.tsx` (new)

Email for existing users. Identical layout to `workspace-invite-email.tsx` but:
- Subject: `"You've been invited to join [workspace] on Flux"`
- Body: `"[InviterName] has invited you to join [WorkspaceName] as [Role]. Since you already have a Flux account, you can join with one click."`
- CTA: `"Join [WorkspaceName]"` → `/join?token=TOKEN`
- No mention of signing up.

### 5. `lib/email/workspace-invite.ts`

Add `sendExistingUserInviteEmail({ to, inviterName, workspaceName, role, joinUrl })` function.

### 6. `app/join/page.tsx` (new — server component)

Accepts `?token=TOKEN` query param.

**Logic:**
1. Look up the `WorkspaceInvite` by token.
2. If not found or expired → render error: "This invite link is invalid or has expired."
3. Check session:
   - **Not logged in** → redirect to `/login?callbackUrl=/join?token=TOKEN`.
   - **Logged in, email does not match invite** → render error: "This invite was sent to a different email address. Please sign in with [invite email]."
   - **Logged in, email matches** → render accept UI (workspace name, role, inviter name) with "Join Workspace" button and "Decline" link.

### 7. `app/join/actions.ts` (new) or inline in `actions/workspace-invite.ts`

`acceptWorkspaceInvite(token)` server action:
1. Authenticate current user.
2. Find invite by token; verify email matches session user.
3. Check user is not already a member.
4. Push `{ userId, role, joinedAt }` to `workspace.members`.
5. Delete the invite document.
6. `revalidatePath` for the workspace team page.
7. Return `{ workspaceSlug }` → client redirects to `/${workspaceSlug}`.

### 8. `app/[slug]/team/page.tsx`

After fetching workspace members, also fetch:

```ts
const pendingInvites = await WorkspaceInvite.find({ workspaceId: workspace._id })
  .lean()
```

For each pending invite where `requiresAcceptance: true` and the invited email belongs to an existing user, optionally join the User collection to get their name/avatar.

Pass `pendingInvites` to the client component.

### 9. `components/team/PendingInviteRow.tsx` (new)

Renders one row per pending invite:
- Avatar (initials fallback if no account, real avatar if existing user)
- Name (email address if no account, real name if existing user)
- Email
- Role badge replaced by a muted grey **"Pending"** badge
- Admin-only: "Cancel" button → calls `cancelWorkspaceInvite(inviteId)` → row disappears

---

## Email Flow Summary

| Scenario | Email sent | CTA destination |
|---|---|---|
| Invite new (unregistered) user | Existing invite email | `/signup?invite=TOKEN` |
| Invite existing user | New join-invite email | `/join?token=TOKEN` |

---

## Team Page Display

Confirmed members and pending invites appear in the same list. Pending invites always sort below confirmed members. The role column shows a grey "Pending" pill instead of ADMIN / EDITOR / VIEWER. Admins see a cancel (×) button on pending rows.

---

## Accept Flow (existing user)

```
Email CTA click
  → /join?token=TOKEN
      → not logged in? → /login?callbackUrl=/join?token=TOKEN → back to /join
      → logged in, email mismatch? → error screen
      → logged in, email matches → accept UI
          → "Join Workspace" button
              → acceptWorkspaceInvite(token) server action
                  → added to workspace.members
                  → invite deleted
                  → redirect to /{workspaceSlug}
```

---

## Out of Scope

- Decline/reject flow (link silently does nothing; invite expires after 7 days).
- Resend invite button (admin can cancel and re-invite).
- Invitation accepted notification to the admin.
- Changes to the new-user (unregistered) invite flow.
