# Admin Access & Accounts

## Super Admin Account

| Property | Value |
|----------|-------|
| **User Email** | owendigitals@gmail.com |
| **User ID** | 6988f8534dae4d868d436577 |
| **Admin ID** | 69b85cc84e40fbfa32d3dd2e |
| **Role** | SUPER_ADMIN |
| **Permissions** | users, workspaces, analytics, settings, billing |

## How to Access Admin Panel

1. Go to `/admin` in your browser
2. Log in with the admin account (owendigitals@gmail.com)
3. You will be redirected to the admin dashboard

## Admin Roles

| Role | Users | Workspaces | Analytics | Settings | Billing |
|------|-------|------------|-----------|----------|----------|
| SUPER_ADMIN | ✓ | ✓ | ✓ | ✓ | ✓ |
| SUPPORT_ADMIN | ✓ | ✓ | ✓ | ✗ | ✗ |
| ANALYTICS_ADMIN | ✗ | ✗ | ✓ | ✗ | ✗ |

## Creating Additional Admins

```bash
# By email
npx tsx scripts/create-admin.ts john@example.com

# By user ID
npx tsx scripts/create-admin.ts --id 65abc123def456789
```

## Admin Capabilities

- **Users**: View, suspend, delete users, change subscription plans
- **Workspaces**: View, archive, delete workspaces, toggle public access, transfer ownership
- **Analytics**: View platform-wide metrics and charts
- **Settings**: Platform configuration (SUPER_ADMIN only)
- **Billing**: Manage subscriptions (SUPER_ADMIN only)

---
*Generated on 2026-03-16*
