# GGN Mobile & Electronic Service — Backend

Node.js + Express + TypeScript + Prisma backend for the GGN Mobile & Electronic
Service website: service booking, CCTV quotations, mobile repair job cards,
inventory, billing, and an API for the admin dashboard.

This pairs with the frontend website (published separately). The frontend's
booking and CCTV quote forms are written to call this API once you deploy it
and set the API URL.

---

## 1. What's included

- **Service booking** — `POST /api/service-requests` (public), list/update for admin
- **CCTV quotation** — `POST /api/cctv-quotes` (public), admin can attach a formal `Quotation`
- **Mobile repair job cards** — full lifecycle (Received → Diagnosis → ... → Delivered)
- **Inventory** — parts/stock tracking with low-stock alerts
- **Invoicing** — line items, VAT/tax, discount, payment method, due balance
- **Content** — gallery, reviews (admin-approved before showing publicly), FAQ
- **Admin auth** — JWT login, role-based (SUPER_ADMIN / MANAGER / TECHNICIAN)
- **Dashboard summary** — counts for the admin dashboard cards

Full schema: `prisma/schema.prisma`.

---

## 2. Local setup

```bash
npm install
cp .env.example .env
# edit .env — at minimum set DATABASE_URL and JWT_SECRET

npx prisma migrate dev --name init
npm run seed        # creates the first admin login
npm run dev          # starts the API on http://localhost:4000
```

Confirm it's running: `GET http://localhost:4000/api/health` → `{"status":"ok"}`

Login with the admin credentials from `.env` (`ADMIN_SEED_EMAIL` /
`ADMIN_SEED_PASSWORD`) via `POST /api/auth/login`, then use the returned
`token` as `Authorization: Bearer <token>` on admin routes.

**Change the seeded admin password immediately after first login** — add a
`PATCH /api/auth/me` route (not included yet) or update it directly via
`npx prisma studio`.

---

## 3. Environment variables

See `.env.example` for the full list. Required to run at all:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL or MySQL connection string |
| `JWT_SECRET` | Long random string signing admin login tokens |
| `CLIENT_ORIGIN` | Your website's domain, for CORS |

Optional but needed for real notifications/storage in production:
`WHATSAPP_ACCESS_TOKEN`, `SMTP_*`, `S3_*` (see file).

**Never commit `.env`** — only `.env.example` should be in version control.

---

## 4. Database

Prisma schema covers: `Admin`, `Customer`, `ServiceRequest`, `JobCard`,
`CctvQuoteRequest`, `Quotation`, `InventoryItem`, `Invoice`, `GalleryImage`,
`Review`, `Faq`, `SiteSetting`.

- Default provider is PostgreSQL. To use MySQL instead, change
  `provider = "postgresql"` to `"mysql"` in `prisma/schema.prisma` and update
  `DATABASE_URL` accordingly.
- Managed Postgres options that work well for a small business site:
  [Supabase](https://supabase.com), [Neon](https://neon.tech),
  [Railway](https://railway.app).
- Run `npx prisma studio` any time to view/edit data in a browser.

---

## 5. Deployment

Any Node host works. Two straightforward options:

**Railway / Render (simplest):**
1. Push this folder to a GitHub repo.
2. Create a new Railway/Render project from the repo, add a PostgreSQL
   database (Railway can provision one), and set the environment variables
   from `.env.example`.
3. Build command: `npm run build && npx prisma migrate deploy`
   Start command: `npm start`

**VPS (more control):** install Node 20+, PM2 or systemd to keep the process
alive, and Nginx as a reverse proxy with an SSL certificate (Let's Encrypt)
in front of port 4000.

After deploying, note your API's base URL (e.g. `https://api.ggnmobilecenter.com.np`)
— the frontend forms need this.

---

## 6. Connecting the website frontend

The website's booking and CCTV quote forms currently record submissions only
in the browser (no backend). To connect them:

1. Deploy this backend and get its base URL.
2. In the website's HTML, replace the form `submit` handlers' local-only
   logic with a `fetch()` call to `POST {API_BASE}/api/service-requests`
   (or `/api/cctv-quotes`), sending the same field names used in the form.
3. Use the `requestCode` returned by the API (instead of the
   client-generated one) for the confirmation screen and WhatsApp message.
4. Set `CLIENT_ORIGIN` in the backend's `.env` to your live website domain
   so CORS allows the request.

---

## 7. Domain connection (ggnmobilecenter.com.np)

- **Frontend (website):** point your domain's DNS to wherever you host the
  published site (e.g. a CNAME/A record per your host's instructions).
- **Backend (API):** use a subdomain, e.g. `api.ggnmobilecenter.com.np`,
  pointed at your backend host, with SSL enabled.
- Update `CLIENT_ORIGIN` (backend) and the frontend's API base URL to match
  your final domains once both are live.

---

## 8. Google Maps setup

The website embeds a map by search query. For a pinpoint-accurate location:
1. Open Google Maps, find your exact shop location, right-click → "What's
   here?" to get coordinates, or use "Share" → "Embed a map" for an embed URL.
2. Replace the `src` of the map `<iframe>` in the website with that embed URL
   (or the coordinates-based query) for an exact pin instead of a name search.
3. Optionally register/claim the location on **Google Business Profile** so
   it shows up in Google Maps and local search directly.

---

## 9. WhatsApp configuration

Two levels:

- **Simple (already on the site):** `wa.me` deep links open WhatsApp with a
  pre-filled message — no backend or API needed. Already implemented.
- **Automated (backend-driven confirmations/status updates):** requires the
  [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
  via a Meta Business account. Set `WHATSAPP_PHONE_NUMBER_ID` and
  `WHATSAPP_ACCESS_TOKEN` in `.env`, then send messages from the
  `service-requests`/`cctv-quotes` routes (marked with `// TODO` in the code)
  using their `/messages` endpoint.

---

## 10. SEO setup

- `sitemap.xml` and `robots.txt` are included alongside the website files —
  update the domain inside `sitemap.xml` if it changes, and resubmit the
  sitemap in **Google Search Console** after the site is live.
- Verify the site in Google Search Console and add the verification meta tag
  or DNS record it gives you.
- Claim the business on **Google Business Profile** for local search/maps.
- The website already includes LocalBusiness and FAQ structured data
  (JSON-LD) in its `<head>` — keep the phone/address in sync if they change.

---

## 11. Notifications architecture

Events that should trigger a notification (WhatsApp/SMS/email), and where to
add them in this codebase:

| Event | Where |
|---|---|
| New service request | `serviceRequests.routes.ts` → `POST /` |
| Booking confirmed | `serviceRequests.routes.ts` → `PATCH /:id` when status → `SCHEDULED` |
| Repair ready | `jobCards.routes.ts` → `PATCH /:id` when status → `READY` |
| Quotation ready | `cctvQuotes.routes.ts` → `POST /:id/quotation` |
| Payment reminder | new scheduled job against `Invoice.due > 0` |
| Service completed | `jobCards.routes.ts` → `PATCH /:id` when status → `DELIVERED` |

Each is marked with a `// TODO` comment or is a natural place to add one.

---

## 12. Future Android/iOS app

Because this is a plain REST API (not tied to the website), a future mobile
app can call the same endpoints directly:
- Reuse `/api/auth/login` for technician/admin login on a companion app.
- Reuse `/api/job-cards` for a technician-facing app to update repair status
  from the field.
- Add push notifications by storing device tokens against `Admin`/`Customer`
  and sending via Firebase Cloud Messaging when status changes.

---

## Security notes

- All admin routes require a valid JWT (`requireAuth`); assign roles
  (`requireRole`) to restrict sensitive actions (e.g. only `SUPER_ADMIN` can
  delete inventory).
- Public form endpoints are rate-limited (20 requests / 15 min / IP) to
  reduce spam; tighten further if needed.
- File uploads (job photos/videos) should go to cloud storage (S3-compatible),
  never saved directly on the API server's disk in production.
- Reviews submitted publicly are hidden (`visible: false`) until an admin
  approves them — this matches the "no fake reviews" rule from the site brief.
