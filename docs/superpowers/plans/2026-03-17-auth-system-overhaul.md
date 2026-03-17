# Authentication System Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete redesign of login/signup UI with real-time validation, password strength indicator, and multi-step onboarding flow.

**Architecture:** Enhance existing NextAuth setup with controlled components + Zod for validation, create new API endpoints for email validation and onboarding, transform onboarding to 3-step flow.

**Tech Stack:** Next.js (App Router), Zod (validation), Framer Motion (animations), NextAuth (existing)

---

## File Structure

```
app/
├── login/page.tsx              # Modify - enhanced UI
├── signup/page.tsx             # Modify - add validation + password strength
├── onboarding/page.tsx        # Modify - transform to multi-step
├── api/auth/validate-email/route.ts  # Create - email availability check
└── api/auth/onboarding/route.ts      # Create - onboarding progress

lib/
├── validations/auth.ts        # Create - Zod schemas
└── password-strength.ts       # Create - password strength utility

hooks/
└── use-password-strength.ts   # Create - password strength hook
```

---

## Task 1: Create Validation Utilities

**Files:**
- Create: `lib/validations/auth.ts`
- Test: Manual testing in signup page

- [ ] **Step 1: Create Zod validation schemas**

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters (8+ with numbers & symbols for stronger security)')
    .refine((password) => {
      // Show suggestion but don't require strong password
      const hasNumber = /\d/.test(password);
      const hasSymbol = /[!@#$%^&*]/.test(password);
      return hasNumber || hasSymbol;
    }, 'Adding numbers and symbols makes your password stronger'),
});

export const validateEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
```

- [ ] **Step 2: Commit**

```bash
git add lib/validations/auth.ts && git commit -m "feat(auth): add Zod validation schemas"
```

---

## Task 2: Create Password Strength Utility

**Files:**
- Create: `lib/password-strength.ts`
- Create: `hooks/use-password-strength.ts`
- Test: Test in signup page

- [ ] **Step 1: Create password strength utility**

```typescript
export type PasswordStrength = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

interface PasswordRequirements {
  minLength: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hasUppercase: boolean;
}

export function calculatePasswordStrength(password: string): {
  strength: PasswordStrength;
  score: number; // 0-4
  requirements: PasswordRequirements;
} {
  const requirements: PasswordRequirements = {
    minLength: password.length >= 6,
    hasNumber: /\d/.test(password),
    hasSymbol: /[!@#$%^&*]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
  };

  let score = 0;
  if (requirements.minLength) score++;
  if (requirements.hasNumber) score++;
  if (requirements.hasSymbol) score++;
  if (requirements.hasUppercase) score++;

  const strength: PasswordStrength =
    score === 0 ? 'empty' : score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong';

  return { strength, score, requirements };
}

export const strengthColors: Record<PasswordStrength, string> = {
  empty: 'bg-gray-200',
  weak: 'bg-red-500',
  fair: 'bg-orange-500',
  good: 'bg-yellow-500',
  strong: 'bg-green-500',
};

export const strengthLabels: Record<PasswordStrength, string> = {
  empty: '',
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};
```

- [ ] **Step 2: Create password strength hook**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { calculatePasswordStrength, PasswordStrength } from '@/lib/password-strength';

export function usePasswordStrength(password: string) {
  const [strength, setStrength] = useState<PasswordStrength>('empty');
  const [score, setScore] = useState(0);
  const [requirements, setRequirements] = useState({
    minLength: false,
    hasNumber: false,
    hasSymbol: false,
    hasUppercase: false,
  });

  useEffect(() => {
    const result = calculatePasswordStrength(password);
    setStrength(result.strength);
    setScore(result.score);
    setRequirements(result.requirements);
  }, [password]);

  return { strength, score, requirements };
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/password-strength.ts hooks/use-password-strength.ts && git commit -m "feat(auth): add password strength utility and hook"
```

---

## Task 3: Create Email Validation API

**Files:**
- Create: `app/api/auth/validate-email/route.ts`
- Test: Test endpoint with curl

- [ ] **Step 1: Create validate-email API endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { validateEmailSchema } from '@/lib/validations/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limit: 10 requests per minute
  const ip = getClientIp(request);
  const rateLimitResult = rateLimit(ip, 10, 60);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { available: false, message: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const result = validateEmailSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { available: false, message: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    await connectDB();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: 'An account with this email already exists. Try signing in instead.',
      });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('[Validate Email] Error:', error);
    return NextResponse.json(
      { available: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/validate-email/route.ts && git commit -m "feat(auth): add email validation API endpoint"
```

---

## Task 4: Create Onboarding API

**Files:**
- Create: `app/api/auth/onboarding/route.ts`
- Test: Test endpoint with curl

- [ ] **Step 1: Create onboarding API endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { z } from 'zod';

const onboardingStep1Schema = z.object({
  step: z.literal(1),
  data: z.object({
    name: z.string().min(1).max(100),
    image: z.string().optional(),
  }),
});

const onboardingStep2Schema = z.object({
  step: z.literal(2),
  data: z.object({
    workspaceName: z.string().min(1).max(100),
    workspaceIcon: z.string().optional(),
  }),
});

const onboardingStep3Schema = z.object({
  step: z.literal(3),
  data: z.object({
    completed: z.boolean(),
  }),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate step
    const step = body.step;
    if (![1, 2, 3].includes(step)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    let schema;
    switch (step) {
      case 1:
        schema = onboardingStep1Schema;
        break;
      case 2:
        schema = onboardingStep2Schema;
        break;
      case 3:
        schema = onboardingStep3Schema;
        break;
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectDB();
    const userId = session.user.id;

    if (step === 1) {
      // Update user profile
      await User.findByIdAndUpdate(userId, {
        $set: {
          name: result.data.data.name,
          image: result.data.data.image,
          'tutorialProgress.hasSeenWelcome': true,
        },
      });
    } else if (step === 3) {
      // Mark tutorial as completed
      await User.findByIdAndUpdate(userId, {
        $set: {
          'onboardingProgress.completedTutorial': true,
          'tutorialProgress.hasSeenDashboard': true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Onboarding] Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/onboarding/route.ts && git commit -m "feat(auth): add onboarding progress API endpoint"
```

---

## Task 5: Redesign Login Page

**Files:**
- Modify: `app/login/page.tsx`
- Test: Visual testing

- [ ] **Step 1: Enhance login page UI**

Keep existing structure but add:
- Better spacing
- Loading states on submit (already exists)
- Better error display
- Account lockout message handling

Note: The existing login page is already quite good. Focus on ensuring consistency with the new signup page.

- [ ] **Step 2: Add account lockout error handling**

Update the error handling in login to detect account lockout. The current NextAuth returns generic errors, but we can add better UX:

```typescript
// In handleSubmit, check for lockout-specific error
if (result?.error) {
  if (result.error.includes('locked') || result.error.includes('too many attempts')) {
    setError('Too many failed attempts. Please try again in 15 minutes.');
  } else if (result.error.includes('credentials')) {
    setError('Invalid email or password. Please try again.');
  } else {
    setError('Something went wrong. Please try again.');
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx && git commit -m "feat(auth): enhance login page UI and error handling"
```

---

## Task 6: Redesign Signup Page with Validation

**Files:**
- Modify: `app/signup/page.tsx`
- Test: Test validation, password strength, email duplicate check

- [ ] **Step 1: Add imports and state**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon, UserIcon, ArrowRightIcon, ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { signIn } from 'next-auth/react';
import { usePasswordStrength } from '@/hooks/use-password-strength';
import { strengthColors, strengthLabels } from '@/lib/password-strength';
```

- [ ] **Step 2: Add validation state**

```typescript
// Add after existing state
const [emailError, setEmailError] = useState('');
const [emailChecking, setEmailChecking] = useState(false);
const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

const { strength, score, requirements } = usePasswordStrength(password);
```

- [ ] **Step 3: Add email validation on blur**

```typescript
const handleEmailBlur = async () => {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setEmailError('Please enter a valid email address');
    setEmailAvailable(null);
    return;
  }

  setEmailChecking(true);
  try {
    const res = await fetch('/api/auth/validate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!data.available) {
      setEmailError(data.message);
      setEmailAvailable(false);
    } else {
      setEmailError('');
      setEmailAvailable(true);
    }
  } catch {
    // Ignore network errors on blur
  } finally {
    setEmailChecking(false);
  }
};
```

- [ ] **Step 4: Update password input with strength indicator**

Replace password input section with:

```tsx
<div className="relative">
  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
  <input
    type="password"
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="input !pl-12"
    minLength={6}
    required
  />
</div>

{password && (
  <div className="space-y-2">
    {/* Strength bar */}
    <div className="flex gap-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= score ? strengthColors[strength] : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
    <div className="flex justify-between items-center text-xs">
      <span className={strength !== 'empty' ? strengthColors[strength].replace('bg-', 'text-') : 'text-gray-400'}>
        {strengthLabels[strength]}
      </span>
      <span className="text-[var(--text-secondary)]">
        {password.length < 6 ? '6+ characters' : 'Good password'}
      </span>
    </div>
  </div>
)}
```

- [ ] **Step 5: Add email validation display**

After email input:

```tsx
{(emailError || emailAvailable !== null) && (
  <motion.div
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex items-center gap-1 text-sm ${
      emailAvailable ? 'text-green-600' : 'text-red-500'
    }`}
  >
    {emailAvailable ? (
      <CheckIcon className="w-4 h-4" />
    ) : (
      <XMarkIcon className="w-4 h-4" />
    )}
    <span>{emailError || 'Email available'}</span>
  </motion.div>
)}
```

- [ ] **Step 6: Update submit to validate before sending**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate email format first
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('Please enter a valid email address');
    return;
  }

  // Check email availability if not already checked
  if (emailAvailable === null) {
    await handleEmailBlur();
    if (!emailAvailable) return;
  }

  setIsLoading(true);
  // ... rest of existing code
};
```

- [ ] **Step 7: Commit**

```bash
git add app/signup/page.tsx && git commit -m "feat(auth): add real-time validation and password strength to signup"
```

---

## Task 7: Transform Onboarding to Multi-Step Flow

**Files:**
- Modify: `app/onboarding/page.tsx`
- Test: Test each step of onboarding

- [ ] **Step 1: Update imports**

Add SparklesIcon to existing imports (from heroicons):

```typescript
import { ..., SparklesIcon } from '@heroicons/react/24/outline';
```

- [ ] **Step 3: Add multi-step state**

```typescript
const [step, setStep] = useState(1);
const [totalSteps] = useState(3);
const [formData, setFormData] = useState({
  name: '',
  image: '',
  workspaceName: '',
  workspaceIcon: '',
});
```

- [ ] **Step 4: Create Step 1 - Welcome/Profile**

Replace current form with conditional rendering:

```tsx
{step === 1 && (
  <motion.div
    key="step1"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-[var(--foreground)]">Welcome to Flux!</h2>
      <p className="text-[var(--text-secondary)]">Let's set up your profile</p>
    </div>

    {/* Profile photo */}
    <div className="flex justify-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-[var(--surface)] flex items-center justify-center overflow-hidden border-2 border-[var(--border)]">
          {formData.image ? (
            <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-10 h-10 text-[var(--text-secondary)]" />
          )}
        </div>
        <button
          type="button"
          className="absolute bottom-0 right-0 w-8 h-8 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-white text-sm"
          onClick={() => {/* TODO: Image upload */}}
        >
          +
        </button>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
        Your name
      </label>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Enter your name"
        className="input"
        required
      />
    </div>

    <button
      type="button"
      onClick={async () => {
        if (!formData.name.trim()) return;
        try {
          await fetch('/api/auth/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 1, data: { name: formData.name, image: formData.image } }),
          });
        } catch (e) {
          // Continue anyway
        }
        setStep(2);
      }}
      disabled={!formData.name.trim()}
      className="btn btn-primary w-full"
    >
      Continue
      <ArrowRightIcon className="w-4 h-4" />
    </button>
  </motion.div>
)}
```

- [ ] **Step 5: Keep Step 2 - Workspace (existing)**

```tsx
{step === 2 && (
  <motion.div
    key="step2"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
  >
    {/* Existing workspace form - keep as is but update to use formData */}
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Create your workspace</h2>
        <p className="text-[var(--text-secondary)]">Workspaces are where your team collaborates</p>
      </div>

      {/* ... existing workspace fields with formData.workspaceName ... */}

      <div className="flex gap-3">
        <button type="button" onClick={() => setStep(1)} className="btn btn-secondary flex-1">
          Back
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          disabled={!formData.workspaceName.trim()}
          className="btn btn-primary flex-1"
        >
          Continue
          <ArrowRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  </motion.div>
)}
```

- [ ] **Step 6: Create Step 3 - Dashboard Tour**

```tsx
{step === 3 && (
  <motion.div
    key="step3"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <SparklesIcon className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--foreground)]">You're all set!</h2>
      <p className="text-[var(--text-secondary)]">Let's take a quick tour of your dashboard</p>
    </div>

    {/* Tour highlights - simplified */}
    <div className="space-y-3">
      <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
        <h3 className="font-medium text-[var(--foreground)]">Sidebar</h3>
        <p className="text-sm text-[var(--text-secondary)]">Navigate between workspaces and settings</p>
      </div>
      <div className="p-4 bg-[var(--surface)] rounded-lg border border-[var(--border-subtle)]">
        <h3 className="font-medium text-[var(--foreground)]">Create Boards</h3>
        <p className="text-sm text-[var(--text-secondary)]">Organize tasks with boards, lists, and cards</p>
      </div>
    </div>

    <div className="flex gap-3">
      <button
        type="button"
        onClick={async () => {
          await fetch('/api/auth/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 3, data: { completed: false } }),
          });
          router.push('/dashboard');
        }}
        className="btn btn-secondary flex-1"
      >
        Skip
      </button>
      <button
        type="button"
        onClick={async () => {
          await fetch('/api/auth/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 3, data: { completed: true } }),
          });
          router.push('/dashboard');
        }}
        className="btn btn-primary flex-1"
      >
        Start Tour
        <ArrowRightIcon className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
)}
```

- [ ] **Step 7: Add progress indicator**

Above the form, add:

```tsx
{/* Progress indicator */}
<div className="flex justify-center gap-2 mb-6">
  {[1, 2, 3].map((s) => (
    <div
      key={s}
      className={`w-2 h-2 rounded-full transition-colors ${
        s === step
          ? 'bg-[var(--brand-primary)]'
          : s < step
          ? 'bg-green-500'
          : 'bg-gray-300'
      }`}
    />
  ))}
</div>
```

- [ ] **Step 8: Commit**

```bash
git add app/onboarding/page.tsx && git commit -m "feat(auth): transform onboarding to multi-step flow"
```

---

## Task 8: Final Testing and Polish

**Files:**
- Test all flows manually
- Fix any issues

- [ ] **Step 1: Test login flow**
- Navigate to /login
- Test Google sign-in button
- Test invalid email format
- Test wrong credentials
- Test account lockout (5 attempts)

- [ ] **Step 2: Test signup flow**
- Navigate to /signup
- Test email validation on blur
- Test password strength indicator
- Test duplicate email check
- Test successful signup

- [ ] **Step 3: Test onboarding**
- Complete signup
- Verify onboarding redirects to /onboarding
- Complete step 1, 2, 3
- Verify lands on dashboard

- [ ] **Step 4: Commit any fixes**

```bash
git add . && git commit -m "fix(auth): address testing issues"
```

---

## Summary

**Tasks:** 8 tasks
**Commits:** ~10 commits (one per task/step)

**Order:**
1. Validation utilities
2. Password strength
3. Email validation API
4. Onboarding API
5. Login page (minor)
6. Signup page (major)
7. Onboarding (major)
8. Testing

Total estimated time: 4-5 hours for fast implementation
