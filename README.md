# 🔧 GigNearby — Gig Work Platform

A connected ecosystem of **3 web apps** for hiring nearby workers for physical gigs — plumber, electrician, elderly care, tutoring, cooking, and more — with smart 2-10% commission.

---

## 🏗️ Architecture

```
gignearby/
├── database/           # Supabase SQL scripts
│   ├── schema.sql      # Tables, enums, triggers
│   ├── rls_policies.sql# Row Level Security per role
│   ├── functions.sql   # Commission calc, rating, matchmaking
│   └── seed.sql        # Sample workers, categories, bookings
├── shared/             # Shared across all 3 apps
│   ├── supabase-config.js  # Supabase client + DemoDB (localStorage mock)
│   ├── auth.js             # Auth + real-time subscriptions
│   └── constants.js        # Categories, i18n (EN/HI), commission rates
├── customer-app/       # 🛒 For people booking workers
│   ├── index.html / styles.css / app.js
├── worker-app/         # 🔧 For gig workers managing bookings
│   ├── index.html / styles.css / app.js
└── admin-app/          # 👑 For platform owner
    ├── index.html / styles.css / app.js
```

---

## 🚀 Quick Start (Demo Mode)

No backend setup required — everything runs in your browser with localStorage.

```bash
# Start any static file server from the project root:
npx -y serve .

# Or with Python:
python -m http.server 3000
```

Then open:

| App | URL | Demo Login |
|-----|-----|------------|
| 🛒 **Customer** | `http://localhost:3000/customer-app/` | `customer@demo.com` / `password123` |
| 🔧 **Worker** | `http://localhost:3000/worker-app/` | `rajesh.kumar@demo.com` / `password123` |
| 👑 **Admin** | `http://localhost:3000/admin-app/` | `admin@gignearby.com` / `admin123` |

---

## ✨ Features

### 🛒 Customer App

- Browse 18 service categories with filters (price, rating, distance)
- View detailed worker profiles with reviews
- Book workers (hourly or monthly) with real-time pricing + commission breakdown
- Track booking status: Pending → Confirmed → In Progress → Completed
- Rate & review workers after completion

### 🔧 Worker App

- Dashboard with earnings, active bookings, and ratings overview
- Accept/reject incoming booking requests
- Update booking status through each stage
- Toggle availability on/off
- View earnings with commission deductions

### 👑 Admin App

- Revenue analytics dashboard (total revenue, commission, active workers)
- User management: view, verify, or ban customers & workers
- View all bookings across the platform
- Per-category commission rate control (2-10%)

### 🌐 Shared Features

- **Bilingual**: Full Hindi/English support (toggle in navbar)
- **Dark Mode**: Premium glassmorphism UI
- **Demo Mode**: 15 pre-seeded workers, 18 categories, 12 sample bookings
- **Responsive**: Mobile-first design (375px → 1440px)

---

## 💰 Commission Rates

| Category | Rate | Example |
|----------|------|---------|
| Personal (Line Standing, Shopping) | 3% | ₹500 → ₹15 |
| Care (Elderly, Childcare, Pet) | 4% | ₹800 → ₹32 |
| Emergency (Plumber, Electrician) | 5% | ₹1000 → ₹50 |
| Home (Cleaner, Painter, Gardener) | 6% | ₹600 → ₹36 |
| Professional (Tutor, Driver, Cook) | 8% | ₹1200 → ₹96 |
| Premium/Custom | 10% | ₹2000 → ₹200 |

---

## 🔄 Moving to Production (Supabase)

1. Create a [Supabase](https://supabase.com/) project
2. Run the 4 SQL files (in order) in the Supabase SQL Editor:
   - `database/schema.sql`
   - `database/rls_policies.sql`
   - `database/functions.sql`
   - `database/seed.sql`
3. Update `shared/supabase-config.js` with your real Supabase URL + anon key
4. The apps will automatically switch from Demo Mode to Production!

---

## 🔒 Auth Roles

| Role | Capabilities |
|------|-------------|
| **Customer** | Browse, book, review, chat |
| **Worker** | Manage profile, accept/reject bookings, track earnings |
| **Admin** | Full access — manage users, bookings, commission rates, revenue |

RLS policies ensure each role can only access their own data. Admin has unrestricted access.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no framework needed)
- **Design**: CSS custom properties, glassmorphism, dark theme
- **Fonts**: Inter (Google Fonts)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Demo**: localStorage mock database with seeded data
