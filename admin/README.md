# Admin Panel — WIN Foundations

Next.js 16 (App Router) admin panel for managing all website content. **This app has zero direct database access** — every operation proxies through the backend API.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** JWT httpOnly cookie (`admin_token`), verified via the backend
- **Email:** Resend (donation receipts only)

## Getting Started

```bash
npm install
cp .env.example .env    # fill in your values
npm run dev              # starts on http://localhost:3002 (or the next free port)
```

Then open `http://localhost:3002/admin/login` in your browser.

## Environment Variables

```env
# Backend's API URL (no trailing slash) — server-side only, not exposed to browser
BACKEND_API_URL=http://localhost:3000/api

# JWT secret — must match the backend's JWT_SECRET exactly
JWT_SECRET=

# Resend (for donation receipt emails sent from the admin panel)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Public site URL, used in generated links
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

> **Note:** `BACKEND_API_URL` is server-side only. Do **not** prefix it with `NEXT_PUBLIC_` — admin credentials and JWT verification happen server-side for security.

## How Authentication Works

1. Admin visits `/admin/login`
2. Submits email + password
3. The login page calls `POST /api/auth/login`, which this app proxies straight through to the **backend**
4. Backend validates credentials and returns a signed JWT
5. This app stores that JWT as an httpOnly cookie (`admin_token`, `SameSite=Lax`) — never readable by client-side JS
6. Every subsequent admin page forwards that JWT as `Authorization: Bearer <token>` on its backend calls
7. The `requireAdmin` middleware on the backend verifies the token on every protected route — it's the real authority, not this app's own cookie check

There is one admin account. Credentials are managed directly in the database via the backend.

## Proxy Pattern

Every `app/api/` route in this app is a thin proxy to the backend. Example flow:

```
Browser → Admin UI page
       → Admin's app/api/campaigns/route.ts (Next.js API route)
       → backendAdminFetch('/campaigns', token, { method: 'PUT', ... })
       → Backend Express route (requireAdmin middleware)
       → Prisma → Supabase PostgreSQL
```

The proxy helpers are in `lib/backendApi.ts`:
- `backendGet(path)` — public (unauthenticated) GET requests
- `backendAdminFetch(path, token, init?)` — authenticated requests; the admin's JWT (read from the `admin_token` cookie via `lib/verifyAdmin.ts`) is forwarded explicitly as the token argument, not just passed along as a cookie

## Admin Pages

| Page | Path | Description |
|---|---|---|
| Dashboard | `/admin` | Overview stats |
| Login | `/admin/login` | Admin sign-in |
| Reset Password | `/admin/reset-password` | Password reset via emailed link |
| Profile | `/admin/profile` | The signed-in admin's own account |
| Campaigns | `/admin/campaigns` | Create/edit fundraising campaigns, products, project details, updates |
| Donations | `/admin/donations` | View donations, update status (`PENDING`/`FAILED` only) |
| Blogs | `/admin/blogs` | Create/edit blog posts |
| Initiatives | `/admin/initiatives` | Manage programme/project pages |
| Camp Locations | `/admin/camp-locations` | Relief/outreach camp locations |
| Team Members | `/admin/team-members` | Team member profiles |
| Gallery | `/admin/gallery` | Photo albums and videos |
| Media | `/admin/media` | Standalone uploaded images/videos |
| Testimonials | `/admin/testimonials` | Donor/volunteer testimonials |
| FAQ | `/admin/faq` | Frequently asked questions |
| Hero Slides | `/admin/hero-slides` | Homepage carousel |
| Impact Counters | `/admin/impact-counters` | Homepage impact statistics |
| Partners | `/admin/partners` | Partner organizations shown on the site |
| Partner Applications | `/admin/partner-applications` | Review partner enquiries |
| Internship Applications | `/admin/internship` | Review internship applications |
| Volunteer Applications | `/admin/volunteers` | Review volunteer applications |
| CV Building | `/admin/cv-building` | CV service requests |
| Messages | `/admin/messages` | Contact form submissions |
| Replies | `/admin/replies` | General reply/feedback form submissions |
| Site Settings | `/admin/site-settings` | Key/value site configuration |
| Updates | `/admin/updates` | News/announcements |

## API Routes (Proxies)

All `app/api/` routes forward to the backend. They do not contain business logic — they:
1. Verify the admin via the `admin_token` cookie
2. Forward the request body and the admin's JWT to the backend
3. Return the backend response to the browser

## Email (Donation Receipts)

The admin panel uses **Resend** to send donation receipt emails when triggered from the Donations page. This is separate from the backend's SMTP setup (which handles contact form notifications, etc.).

Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env` to enable this feature.

## Application Status Values

When updating a status from the admin panel:

| Type | Available Statuses |
|---|---|
| Partner / Internship / Volunteer | `NEW` `REVIEWING` `CONTACTED` `APPROVED` `REJECTED` `CLOSED` |
| Donations | `PENDING` `FAILED` (`SUCCESS` is set automatically by the payment flow — cannot be set manually) |
| Contact Messages | `NEW` `CONTACTED` `CLOSED` |
| CV Requests | `PENDING` `IN_PROGRESS` `COMPLETED` `REJECTED` |
| Replies | `NEW` `READ` `REPLIED` |

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Security Notes

- The admin panel URL should not be publicly indexed. Add robots.txt rules or restrict access at the hosting/CDN level.
- The `admin_token` cookie is `httpOnly` with `SameSite=Lax` — it cannot be read by JavaScript.
- `BACKEND_API_URL` is never sent to the browser. All backend calls happen server-side inside Next.js API routes.
- If you suspect the admin account is compromised, update the password hash directly in the database using `bcrypt` and rotate `JWT_SECRET` (which will invalidate all existing sessions).
