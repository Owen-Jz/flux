# Flux - Paystack Monetization Implementation Guide

## Overview
This document describes the Paystack subscription billing implementation for Flux project management SaaS.

---

## Pricing Structure (in Nigerian Naira)

| Plan | Price | Projects | Members | Features |
|------|-------|----------|---------|----------|
| Free | ₦0/mo | 3 | 3 | Basic Analytics, Community Support |
| Starter | ₦5,000/mo | 5 | 10 | Email Support, Custom Workflows, API Access |
| Pro | ₦15,000/mo | Unlimited | 25 | Advanced Analytics, Priority Support, Admin Controls, SSO |
| Enterprise | Custom | Unlimited | Unlimited | Dedicated Support, SLA, On-premise, Custom Contracts |

---

## Files Created/Modified

### New Files

1. **`lib/paystack.ts`**
   - Paystack API integration utilities
   - Customer management (create, get)
   - Plan management (create, get)
   - Subscription handling (initialize, verify, enable, disable)
   - Webhook signature verification
   - Plan pricing constants and limits

2. **`lib/plan-limits.ts`**
   - Plan limits utility functions
   - `canCreateProject()` - Check if user can create more projects
   - `canAddMember()` - Check if user can add more members
   - `hasFeature()` - Check if plan has specific feature
   - `getUpgradeMessage()` - Get upgrade prompt message

3. **`app/api/billing/initialize/route.ts`**
   - POST: Initialize Paystack subscription checkout
   - Creates/gets Paystack customer
   - Returns authorization URL for payment

4. **`app/api/billing/verify/route.ts`**
   - POST: Verify payment and activate subscription
   - GET: Get current subscription status
   - Updates user plan based on payment

5. **`app/api/billing/cancel/route.ts`**
   - POST: Cancel active subscription
   - Downgrades user to free plan

6. **`app/api/billing/webhook/route.ts`**
   - POST: Handle Paystack webhooks
   - Events: subscription.created, subscription.not_renewed, subscription.disabled, charge.success, invoice.payment_failed

7. **`components/billing/billing-section.tsx`**
   - React component for billing management
   - Plan selection UI
   - Subscription status display
   - Upgrade/cancel functionality

### Modified Files

1. **`models/User.ts`**
   - Added `PlanType` type
   - Added billing fields:
     - `plan: PlanType` - Current plan ('free', 'starter', 'pro', 'enterprise')
     - `paystackCustomerCode` - Paystack customer ID
     - `subscriptionId` - Active subscription ID
     - `subscriptionStatus` - 'active', 'inactive', 'cancelled', 'past_due'
     - `subscriptionPlanId` - Plan code
     - `billingEmail` - Billing email
     - `trialEndsAt` - Trial expiration date
     - `hasUsedTrial` - Trial usage flag

2. **`actions/board.ts`**
   - Added plan limit check before creating board
   - Enforces project limits per plan

3. **`actions/workspace-invite.ts`**
   - Added plan limit check before adding member
   - Enforces member limits per plan

4. **`app/[slug]/settings/settings-client.tsx`**
   - Added Billing tab
   - Integrated BillingSection component

5. **`components/landing/pricing-section.tsx`**
   - Updated pricing to Nigerian Naira
   - Added Starter plan (₦5,000)
   - Updated features per plan

6. **`.env.example`**
   - Added Paystack environment variables

---

## Environment Variables Required

Add these to your `.env.local`:

```bash
# Paystack (https://paystack.com)
PAYSTACK_SECRET_KEY=sk_test_your-secret-key
PAYSTACK_PUBLIC_KEY=pk_test_your-public-key
PAYSTACK_STARTER_PLAN_CODE=PLN_starter_monthly
PAYSTACK_PRO_PLAN_CODE=PLN_pro_monthly
PAYSTACK_ENTERPRISE_PLAN_CODE=PLN_enterprise_monthly

# App URL (for payment callbacks)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Paystack Dashboard Setup

### 1. Get API Keys
1. Go to Paystack Dashboard → Settings → API Keys
2. Copy Test/Secret keys to `.env.local`

### 2. Create Plans
1. Go to Settings → Plans
2. Create plans matching your pricing:
   - **Starter**: ₦5,000/month
   - **Pro**: ₦15,000/month
   - **Enterprise**: Custom pricing
3. Copy plan codes to environment variables

### 3. Set Up Webhook
1. Go to Settings → Webhooks
2. Add endpoint: `https://yourdomain.com/api/billing/webhook`
3. Select events:
   - subscription.created
   - subscription.not_renewed
   - subscription.disabled
   - charge.success
   - invoice.payment_failed

---

## How It Works

### Subscription Flow

1. **User selects plan** on Billing page
2. **System calls** `/api/billing/initialize` with plan
3. **Paystack returns** authorization URL
4. **User redirected** to Paystack checkout
5. **On success**, user returns to app with reference
6. **System verifies** payment via `/api/billing/verify`
7. **User plan** updated to paid plan

### Webhook Handling

When Paystack processes events:
- `subscription.created` → Activates subscription
- `charge.success` → Confirms payment
- `subscription.disabled` → Downgrades to free
- `invoice.payment_failed` → Marks as past_due

### Plan Limit Enforcement

- **Board Creation**: Checked in `createBoard` action
- **Member Invitation**: Checked in `inviteMemberToWorkspace` action
- Users see upgrade prompt when hitting limits

---

## Testing

### Test Cards (Paystack)
Use these test cards for sandbox testing:

| Card Number | Expiry | CVV | Description |
|-------------|--------|-----|-------------|
| 4084084084084081 | Any future | 123 | Success |
| 4084084084084080 | Any future | 123 | Generic decline |

### Testing Steps

1. Start development server
2. Sign up/login
3. Go to Workspace Settings → Billing
4. Select a plan
5. Complete payment with test card
6. Verify plan upgrade

---

## API Endpoints

### POST /api/billing/initialize
Initialize subscription checkout.

**Request:**
```json
{ "plan": "starter" | "pro" }
```

**Response:**
```json
{
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "sub_..."
}
```

### POST /api/billing/verify
Verify payment and activate subscription.

**Request:**
```json
{
  "reference": "payment_reference",
  "plan": "starter" | "pro"
}
```

**Response:**
```json
{
  "success": true,
  "plan": "pro",
  "status": "active"
}
```

### GET /api/billing/verify
Get current subscription status.

**Response:**
```json
{
  "plan": "free",
  "status": "inactive",
  "subscriptionId": "...",
  "trialEndsAt": "...",
  "hasUsedTrial": false
}
```

### POST /api/billing/cancel
Cancel active subscription.

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled"
}
```

### POST /api/billing/webhook
Handle Paystack webhook events.

**Headers:**
- `x-paystack-signature`: Webhook signature for verification

---

## Revenue Leak Fixes Implemented

1. **Plan Limits**: Free tier now limited to 3 projects and 3 members
2. **Upgrade Prompts**: Users prompted to upgrade when hitting limits
3. **Feature Gating**: Pro features locked behind paid plans
4. **Subscription Status**: Track active/inactive/cancelled status

---

## Future Monetization Opportunities

1. **Per-seat billing**: Add more members at $5/user
2. **Usage-based pricing**: API calls, storage limits
3. **Add-ons**:
   - Extra storage (₦2,000/5GB)
   - Additional workspaces (₦3,000/workspace)
   - Priority support (₦5,000/month)
4. **Marketplace**: Third-party integrations
5. **Templates**: Premium project templates
6. **Professional Services**: Training, onboarding
