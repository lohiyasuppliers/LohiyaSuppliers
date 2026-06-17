# Lohiya Suppliers — B2B Abrasives E-commerce Platform

Full-stack, transactional B2B e-commerce for an abrasives business (~100 products, ~300 clients). Every client sees custom prices, places prepaid/postpaid orders, earns per-client cashback, and uses per-client vouchers — all controlled from the admin panel.

## Stack (chosen)

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 15** (App Router) + **TypeScript** |
| UI | **Tailwind CSS 4** + **shadcn/ui** (New York style) |
| Database | **PostgreSQL** + **Prisma ORM** |
| Auth | **Auth.js (NextAuth v4)** — email/password + RBAC (`ADMIN`, `CLIENT`) |
| Payments | **Razorpay** (Module 6 — behind swappable gateway interface) |
| Images | **Cloudinary** or **S3** (Module 2) |
| Email | **Resend** / SMTP (Module 6+) |
| CSV import | **papaparse** (Module 4) |
| Money | Integer **paise** everywhere (no floats) |

## Build progress

| # | Module | Status |
|---|--------|--------|
| 1 | Auth + roles + DB schema/migrations | ✅ Done |
| 2 | Catalog (categories, products, services, variations, images) | 🔜 Next |
| 3 | Pricing engine + per-client overrides | Pending |
| 4 | Client management + CSV import | Pending |
| 5 | Cart, checkout, prepaid/postpaid orders + admin approval | Pending |
| 6 | Razorpay + GST invoicing | Pending |
| 7 | Cashback (assignment, ledger, redemption) | Pending |
| 8 | Vouchers | Pending |
| 9 | Client dashboard + admin dashboard polish | Pending |

> **Note:** Legacy storefront/admin pages from the initial build are being migrated module-by-module. After Module 1, run the new PostgreSQL setup below.

## Quick start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

Or use [Neon](https://neon.tech), [Supabase](https://supabase.com), or any PostgreSQL host.

### 2. Environment

```bash
cp .env.example .env
# Edit DATABASE_URL, NEXTAUTH_SECRET, etc.
```

### 3. Database

```bash
npm install
npm run db:migrate    # creates tables from migrations
npm run db:seed       # admin, test clients, sample catalog
```

For a quick schema sync without migration history:

```bash
npm run db:push
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lohiyasuppliers.com | admin123 |
| Client | client@example.com | client123 |
| Client | metalworks@example.com | client123 |

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## User roles

- **Guest** — browse catalog, see default prices; must register/login to order
- **CLIENT** — custom prices, orders, cashback, vouchers, dashboard
- **ADMIN** — full admin panel control

## Environment variables

See [`.env.example`](.env.example) for all keys. Required for Module 1:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — random secret for JWT
- `NEXTAUTH_URL` — e.g. `http://localhost:3000`

## Database schema highlights

- **Catalog:** `Category` (PRODUCT \| SERVICE), `Product`, `ProductVariation`
- **Pricing:** `ClientPriceOverride` (per client × product × variation)
- **Orders:** `PREPAID` / `POSTPAID`, lifecycle `PENDING_APPROVAL` → `COMPLETED`
- **GST:** `Invoice` with CGST/SGST/IGST split
- **Cashback:** `CashbackRule`, `CashbackLedgerEntry`, `CashbackRedemption`
- **Vouchers:** `ClientVoucher` (per-client, scoped)

All prices stored as **paise** (`Int`).

## Scripts

```bash
npm run dev              # development server
npm run build            # production build
npm run db:migrate       # prisma migrate dev
npm run db:seed          # seed sample data
npm run db:studio        # Prisma Studio
```

## Project structure

```
src/
├── app/
│   ├── (store)/         # Public storefront + client dashboard
│   ├── admin/           # Admin panel
│   └── api/             # API routes (RBAC on every client-scoped route)
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── admin/
│   └── ...
├── lib/
│   ├── auth.ts          # Auth.js config
│   ├── rbac.ts          # Role-based access control helpers
│   ├── money.ts         # Paise utilities
│   └── constants.ts
prisma/
├── schema.prisma        # Full B2B schema
└── seed.ts
```

## License

Private — Lohiya Suppliers © 2026
