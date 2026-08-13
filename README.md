# Petty Cash Management System

## 1. Overview & Purpose
Petty Cash Management System is a lightweight, secure web application designed to manage, record, and consolidate internal cash flows (Petty Cash). It strictly tracks the chronological history of financial movements including Allocations (Droppings/Transfers) and Transactions (Expenses) across various internal Cash Sources with full Admin/User access control.

## 2. Tech Stack
- **Framework:** Next.js 16 (App Router) with Turbopack
- **Language:** TypeScript
- **Database & Auth:** Supabase (PostgreSQL, Row Level Security, Supabase Auth)
- **Styling:** Tailwind CSS v4

## 3. Environment Variables
You must set up the following environment variables in your `.env.local` file for local development or in your hosting provider's dashboard for production:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
*(Note: Never expose your Supabase Service Role Key or Database Password here.)*

## 4. Running the Project Locally
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 5. Main Modules
- **Authentication:** Secure login using Supabase Auth.
- **Dashboard:** High-level summary of authorized cash sources and latest activities.
- **Transactions:** Record operational expenses natively bounded by Cash Sources.
- **Allocations:** Transfer funds securely between Cash Sources (Internal Droppings).
- **Master Data:** Manage Categories, Divisions, Fund Holders, Cash Sources, and User Access Roles (Admin Only).
- **Rekap (Monthly Report):** Read-only automated consolidated reporting to track opening and closing periodic balances.

- **Budget Replenishment (Tetapkan Pagu):** Secure RPC-based mechanism to top up Main Cash from central funds without manual allocation entries, avoiding race conditions and ensuring accurate financial boundaries.

## 6. Login & Admin Setup
- Users authenticate via Email and Password.
- Application authorization is strictly enforced by `profiles` (Roles: `ADMIN` or `USER`) and `user_cash_source_access` relations.
- **Initial Setup:** You must create the first user through the Supabase Dashboard Authentication menu. Afterward, manually set their `role` to `'ADMIN'` inside the `profiles` table to bootstrap system configuration.

## 7. Deployment & Security Notes
- This Next.js application is ready to be deployed on platforms like Vercel.
- **Database Migrations:** Ensure all files in `supabase/migrations/*` are executed on your production Supabase project in chronological order.
- **Service Role:** The application operates strictly using the `NEXT_PUBLIC_SUPABASE_ANON_KEY` combined with Supabase Auth and RLS. **DO NOT** add or expose the `SUPABASE_SERVICE_ROLE_KEY` to the client or the environment variables, as the application's architecture does not require it and it poses a critical security risk.
- The repository is completely stateless on the backend. All critical financial logic and constraints are handled via PostgreSQL Views (`v_cash_source_balances`) and RPCs (`set_budget_ceiling`, `create_transaction`, `create_allocation`), ensuring maximum data integrity regardless of the frontend client. 
