# Workspace Icon & Image Design

## Overview

Allow workspace admins to set a custom icon or image for their workspace, displayed in the sidebar workspace switcher and on dashboard workspace cards.

## Goals

- Workspace admins can upload a custom image (PNG, JPG, SVG) to represent their workspace
- Workspace admins can choose from a curated emoji set as an icon
- The chosen icon/image appears in the sidebar and on dashboard cards
- Non-admins can view the icon but cannot change it

## Data Model

### Workspace Schema Changes

Add `icon` field to `Workspace.settings`:

```typescript
settings: {
    publicAccess: { type: Boolean, default: false },
    accentColor: { type: String },
    icon: {
        type: String,  // 'upload' | 'emoji'
        url: String,   // for uploaded images
        emoji: String, // for emoji selection
    }
}
```

## Storage

- **Image uploads**: Uploadthing
  - Bucket: `workspace-icons`
  - Max file size: 2MB
  - Allowed types: PNG, JPG, JPEG, SVG, WebP
  - Storage path: `/{workspaceId}/{filename}`

## API / Server Actions

### `updateWorkspaceSettings`

Extend existing action to accept:

```typescript
icon?: {
    type: 'upload' | 'emoji',
    url?: string,
    emoji?: string
}
```

### `uploadWorkspaceIcon` (new)

Server action for handling Uploadthing file upload:

```typescript
async function uploadWorkspaceIcon(workspaceId: string, file: File)
```

## UI Components

### 1. WorkspaceIconPicker (new)

A modal component (`components/workspace/workspace-icon-picker.tsx`) with two tabs:

**Upload Tab:**
- Drag-and-drop zone or file input
- Preview of uploaded image
- Remove button
- Accepts: PNG, JPG, SVG, WebP (max 2MB)

**Emoji Tab:**
- Grid of curated emojis (48px grid, ~100 emojis)
- Categories: Faces, Objects, Symbols, Nature, Activities
- Search filter

**Actions:**
- Save button (only for admins)
- Cancel button
- Remove icon button (if icon is set)

### 2. Sidebar Changes (`components/sidebar.tsx`)

Update workspace list item to show:

```tsx
// If icon.type === 'emoji'
<span className="text-xl">{icon.emoji}</span>

// If icon.type === 'upload'
<img src={icon.url} alt="" className="w-6 h-6 rounded object-cover" />

// Fallback (no icon set)
<div className="w-6 h-6 rounded bg-[var(--border-subtle)] flex items-center justify-center text-xs font-medium">
    {workspace.name.charAt(0)}
</div>
```

### 3. Dashboard Card Changes (`components/dashboard/WorkspaceCard.tsx`)

Update header to show icon/image:

```tsx
// In the gradient header area
{icon.type === 'emoji' && <span className="text-6xl">{icon.emoji}</span>}
{icon.type === 'upload' && (
    <img src={icon.url} alt="" className="w-16 h-16 rounded-lg object-cover" />
)}
{!icon && <span className="text-7xl font-bold opacity-20">{name.charAt(0)}</span>}
```

### 4. Workspace Settings Page (`app/[slug]/settings/page.tsx`)

Add "Workspace Icon" section with:
- Current icon preview (large)
- "Change Icon" button → opens WorkspaceIconPicker modal

## File Changes Summary

| File | Action |
|------|--------|
| `models/Workspace.ts` | Add `icon` field to settings schema |
| `actions/workspace.ts` | Extend `updateWorkspaceSettings` to handle icon |
| `lib/uploadthing.ts` | Create Uploadthing configuration |
| `components/workspace/workspace-icon-picker.tsx` | **New** — icon picker modal |
| `components/sidebar.tsx` | Show icon/emoji instead of letter avatar |
| `components/dashboard/WorkspaceCard.tsx` | Show icon/emoji in header |
| `app/[slug]/settings/page.tsx` | Add icon management section |

## Environment Variables

Add to `.env.local`:

```
UPLOADTHING_SECRET=[UPLOADTHING_SECRET]
UPLOADTHING_APP_ID=t04v4hfhtt
```

## Implementation Order

1. Add `icon` field to Workspace model
2. Set up Uploadthing configuration
3. Update `updateWorkspaceSettings` action
4. Build `WorkspaceIconPicker` component
5. Update sidebar to display icons
6. Update dashboard cards to display icons
7. Add icon management to settings page

## Permissions

- Only workspace admins can change the icon
- All workspace members can view the icon
