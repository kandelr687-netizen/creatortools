# Creators Point

A full-stack creator reward platform. Creators submit content (Google Drive links) to earn points, which can be redeemed for withdrawals (UPI payments). Built with React, TypeScript, Vite, Tailwind CSS v4, and Supabase.

## Roles

- **Admin** — reviews submissions & withdrawals, manages categories/campaigns/events, adjusts points, sends announcements, views audit logs, configures site settings & payment methods.
- **Creator (User)** — submits content to active events, tracks submissions, views point ledger, requests withdrawals, receives notifications, manages profile.

## Tech Stack

- **Frontend**: Vite + React 19 + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), react-router, zustand, framer-motion, lucide-react, react-hot-toast
- **Backend**: Supabase (Postgres, Auth, Storage, Row Level Security)
- All mutation logic is enforced in **database RPC functions** (security-definer) — points are only awarded/deducted inside transactions.

## Getting Started

### 1. Create a Supabase project

Sign in at [supabase.com](https://supabase.com) and create a new project.

### 2. Apply the database schema

Run the migration with the Supabase CLI:

```
supabase link --project-ref <your-project-ref>
supabase db push
```

## 3. Seed an admin user

Set `is_admin: true` in the user's `raw_user_meta_data` (via the Supabase dashboard → Authentication → Users → edit the user, or the `inline` editor), then re-run `handle_new_user` trigger effect by updating the profile:

```sql
update public.profiles set role = 'admin' where user_id = <the user's id>;
```

Admins can also log in directly from `/admin-login`.

### 4. Configure environment

Copy `.env.example` to `.env` and fill in your project's URL and anon key:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the app

```
npm install
npm run dev
```

Production build:

```
npm run build
npm run preview
```

## Key flows

1. **Submit content** — creators paste a Google Drive link against an active event. The DB function validates the URL, blocks duplicates, and (if configured) enforces the points threshold.
2. **Admin review** — approving a submission awards `reward_points`, rejecting deducts `rejection_points`. All changes are audited in `admin_logs` and notified.
3. **Withdrawals** — creators attach a UPI QR image (stored in the private `private-files` bucket). On approval the balance is deducted; on rejection the points are restored. Double-approval is impossible.
4. **Event control** — admins can open/close events; the DB rejects submissions to closed events regardless of the UI.

## Project structure

```
supabase/migrations/     # SQL schema, RPCs, triggers, RLS, storage buckets
src/
  components/            # ui (button, card, modal, ...) and shared (layout-level) components
  pages/
    auth/                # login, register, password reset, admin login
    customer/            # creator-facing pages
    admin/               # admin-facing pages
    public/              # landing page
  functions/             # typed wrappers around RPC calls
  lib/                   # supabase client, utils
  store/                 # zustand auth store
  types/                 # shared TypeScript types
```

## Security notes

- RLS is enabled on every table; profile writes are restricted to the owner, and `points_balance` / `role` / `status` columns are never directly updatable.
- Direct inserts/updates on submissions, transactions, withdrawals, notifications, and audit logs are blocked — all mutations go through security-definer RPCs.
- Admin authorization is verified server-side via `public.is_admin()`.