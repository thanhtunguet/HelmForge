# User Management Implementation

## Overview
Implemented a role-based user management system with admin privileges to manage user accounts.

## Components Created

### 1. Database Migration
**File:** `supabase/migrations/20251227000000_add_admin_role_to_profiles.sql`
- Added `is_admin` boolean field to profiles table
- Added `banned_until` timestamp field for tracking user ban status
- Created RLS policies allowing admins to view and update all profiles
- Created `is_admin()` function to check admin status

### 2. Edge Function
**File:** `supabase/functions/user-admin/index.ts`
- Handles all admin user operations securely with service role
- Endpoints:
  - `create-user`: Create new users with optional admin privileges
  - `update-user`: Update user display name
  - `update-password`: Change user password
  - `ban-user`: Disable user account (with duration options)
  - `unban-user`: Reactivate disabled user accounts
- Includes admin role verification for all operations

### 3. User Management Page
**File:** `src/pages/UserManagement.tsx`
- Admin-only page (redirects non-admins to dashboard)
- Features:
  - Lists all users with email, name, role, status, and creation date
  - Create new users with email, password, display name, and admin toggle
  - Edit user display names
  - Update user passwords
  - Disable users with configurable duration (1 day, 1 week, 1 month, permanent)
  - Reactivate disabled users
  - Confirmation dialogs for destructive actions
  - Prevents self-modification (can't edit or disable yourself)

### 4. Routing & Navigation
- Added `/users` route in App.tsx (protected)
- Updated Sidebar.tsx to show "User Management" link for admin users only
- Admin status is checked dynamically using the profiles table

## Access Control

### Admin Privileges
- Only users with `is_admin = true` in profiles table can access user management
- Edge function validates admin status on every request
- Sidebar conditionally shows user management link

### User Status
- **Active**: Normal user with full access
- **Disabled**: User banned until specified date or permanently
- Ban durations: 1 day, 1 week, 1 month, permanent

## Security Features
- All admin operations require authentication
- Service role key used securely in Edge Functions only
- RLS policies prevent non-admins from viewing other users
- Users cannot modify themselves (edit/disable)
- Edge Function validates admin role before any operation

## Usage

### Making a User Admin
1. Run database migration to add is_admin field
2. Manually update a user's profile: `UPDATE profiles SET is_admin = true WHERE id = 'user-id'`
3. That user can now access User Management at `/users`

### Creating New Users
1. Navigate to User Management
2. Click "Create User"
3. Enter email, display name, password
4. Optionally toggle "Grant admin privileges"
5. Click "Create User"

### Managing Users
- **Edit**: Click edit icon to change display name
- **Password**: Click key icon to set new password
- **Disable**: Click X icon, select ban duration, confirm
- **Reactivate**: Click check icon, confirm

## Technical Notes
- Uses Supabase Auth Admin API for user creation and banning
- Ban duration is stored in both auth.users (via ban_duration) and profiles.banned_until
- Edge Function endpoints are called via fetch with bearer token
- TypeScript types defined for UserProfile and BanDuration
- Follows existing patterns from ServiceAccounts page
