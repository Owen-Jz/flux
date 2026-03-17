# Authentication System Overhaul - Design Spec

**Date:** 2026-03-17
**Status:** Approved (2026-03-17)
**Author:** Claude

## Overview

Complete redesign and implementation of the user authentication system with focus on UI/UX improvements, real-time validation, and onboarding experience.

## Scope

- **In Scope:**
  - Redesign login/signup pages with modern UI
  - Real-time validation (email format, password strength, duplicate detection)
  - Improved error handling with user-friendly messages
  - Complete onboarding redesign (progressive profile + guided tour)
  - Keep existing security (bcrypt, JWT, rate limiting, account lockout)

- **Out of Scope:**
  - Two-factor authentication
  - Additional social providers (Google only)
  - Email verification
  - Password reset (already implemented in existing codebase)

## UI/UX Specification

### Login Page

**Layout:**
- Centered card layout on gradient/brand background
- Logo at top
- Card: 480px max-width, padding 32px

**Components:**
- Google sign-in button (full width, prominent)
- Divider with "or continue with email"
- Email input with envelope icon
- Password input with lock icon
- "Forgot password?" link
- Submit button with loading state
- Link to signup page

**States:**
- Default, Focus (brand border), Error (red border), Disabled (opacity 0.5)

### Sign Up Page

**Layout:** Same as login

**Components:**
- Google sign-in button
- Divider
- Name input (user icon)
- Email input (envelope icon)
- Password input (lock icon)
- Password strength indicator (visual bar)
- Real-time validation feedback
- Submit button with loading state
- Link to login page

**Password Strength Indicator:**
- Visual bar: 4 segments
- Colors: Red (weak) → Orange (fair) → Yellow (good) → Green (strong)
- Requirements shown below: 6+ characters minimum (existing backend), stronger = 8+ chars with number, symbol, uppercase

**Real-time Validation:**
- Email: Check format on blur
- Password: Check strength on input
- Email duplicate: Check on blur against API

### Error Handling

**Error Messages:**
| Scenario | Message |
|----------|---------|
| Invalid email | "Please enter a valid email address" |
| Weak password | "Password must be at least 6 characters" (show stronger suggestion: "8+ with numbers & symbols for stronger security") |
| Email exists | "An account with this email already exists. Try signing in." |
| Network error | "Unable to connect. Check your connection and try again." |
| Server error | "Something went wrong. Please try again in a few moments." |
| Account locked | "Too many failed attempts. Try again in 15 minutes." |
| Wrong credentials | "Invalid email or password. Please try again." |

**Display:**
- Inline errors below fields
- Alert banner for form errors
- Toast for success messages

## Onboarding Specification

### Step 1: Welcome
- Welcome message with user name
- Profile photo upload (optional)
- Name input (pre-filled from OAuth if available)
- "Continue" button

### Step 2: Workspace Setup
- "Create your first workspace" header
- Workspace name input
- Workspace icon/color picker (optional)
- Skip option

### Step 3: Dashboard Tour
- Interactive tooltips on first visit
- Highlight: Sidebar, Create Board, Settings
- "Create your first board" CTA
- Progress: Step 1 of 3
- Skip button

### Post-Onboarding
- Achievement toast for completing onboarding
- Quick tips cards on dashboard (optional)

## Technical Implementation

### Frontend Stack
- React Hook Form + Zod for validation
- Framer Motion for animations
- Existing design system (cards, buttons, inputs)

### Backend (Existing - Keep)
- NextAuth with JWT strategy
- bcrypt password hashing (12 rounds)
- Account lockout (5 attempts, 15 min)
- Rate limiting

### New API Endpoints

**POST /api/auth/validate-email**
- Request: `{ "email": "user@example.com" }`
- Response success: `{ "available": true }`
- Response taken: `{ "available": false, "message": "An account with this email already exists" }`
- Rate limited: 10 requests/minute

**POST /api/auth/onboarding**
- Request: `{ "step": 1|2|3, "data": { ... } }`
- Step 1 data: `{ "name": "string", "image": "base64|string" }`
- Step 2 data: `{ "workspaceName": "string", "workspaceIcon": "string" }`
- Step 3 data: `{ "completed": true }`
- Response: `{ "success": true, "progress": { ... } }`

### Data Model (User Model Updates)
```typescript
tutorialProgress: {
  hasSeenWelcome: boolean;
  hasSeenDashboard: boolean;
  hasSeenBoard: boolean;
  hasSeenSettings: boolean;
}
onboardingProgress: {
  createdFirstBoard: boolean;
  addedFirstTeamMember: boolean;
  createdFirstTask: boolean;
  completedFirstDragDrop: boolean;
  completedTutorial: boolean;
  dismissedAt?: Date;
}
```

## Acceptance Criteria

1. Login page displays correctly with Google + email/password options
2. Signup page validates email format in real-time
3. Password strength indicator shows accurate feedback
4. Duplicate email check happens on blur with friendly message
5. All error states show appropriate user-friendly messages
6. Onboarding flow has 3 clear steps
7. Dashboard tour highlights key areas on first visit
8. Authentication completes within 2 seconds
9. Mobile responsive on all pages
   - Card: 100% width on mobile, max 480px on desktop
   - Stack vertically on screens < 640px
   - Touch-friendly button sizes (min 44px tap target)

## Timeline

**Fast Track:**
- Phase 1: Login/Signup UI + Validation (1-2 days)
- Phase 2: Error handling improvements (half day)
- Phase 3: Onboarding redesign (1-2 days)
- Phase 4: Testing + polish (half day)

Total: ~4-5 days
