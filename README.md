<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,50:b8860b,100:0a0a0a&height=220&section=header&text=ZYVRO&fontSize=60&fontColor=E8C878&fontAlignY=38&desc=Own%20Your%20Style%20%E2%80%94%20Premium%20Streetwear%20%F0%9F%96%A4&descAlignY=58&descSize=20&animation=fadeIn"/>

<br/>

[![Live Repo](https://img.shields.io/badge/🌐%20GitHub-ZYVRO-b8860b?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Nayeem131136/zyvro-official)
&nbsp;
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
&nbsp;
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
&nbsp;
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
&nbsp;
[![License](https://img.shields.io/badge/License-MIT-b8860b?style=for-the-badge)](LICENSE)

<br/>

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=18&pause=1000&color=E8C878&center=true&vCenter=true&width=650&lines=Premium+Bangladeshi+Streetwear+%F0%9F%96%A4;Oversized+Drop+Shoulder+Tees%20%F0%9F%91%95;WhatsApp-Powered+Ordering+%F0%9F%92%AC;Real-Time+Admin+%2B+Order+Management+%E2%9A%A1" alt="Typing SVG"/>

</div>

---

## 📖 About

**ZYVRO** is a premium Bangladeshi streetwear e-commerce storefront built around Oversized Drop Shoulder T-shirts. The site is a full **catalog + WhatsApp-order** experience — no payment gateway needed. Customers browse products, pick a color/size, and a professional order flow collects delivery details, shows a live order summary, then hands off to WhatsApp with a fully pre-filled message. An admin panel (Supabase-backed, real-time) manages products, size guides, and the full order lifecycle.

> *"Not for everyone. Built different."*

---

## ✨ Key Features

<div align="center">

| Feature | Description |
|---|---|
| 🛍️ **Dynamic Product Catalog** | Products, categories, colors, sizes & stock — all managed live from the admin panel |
| 💬 **3-Step WhatsApp Order Flow** | Customer info → live order summary → auto-generated WhatsApp message with full order details |
| 📏 **Dynamic Size Guide System** | Unlimited size guides per category, fully editable tables (not static images) |
| 🔔 **Real-Time Order Notifications** | New orders push instantly to the admin dashboard via Supabase real-time |
| 📦 **Full Order Management** | Pending → Confirmed → Printing → Packed → Shipped → Delivered, with timeline history |
| 🔐 **Admin-Only Auth** | Single gated admin login (Supabase Auth) — no public signup, RLS-enforced writes |
| 🖼️ **Auto Image Compression** | Uploads are resized & compressed client-side before hitting storage |
| 🎨 **Premium Dark/Gold UI** | Moody, editorial streetwear aesthetic with scroll-reveal micro-animations |

</div>

---

## 🛠️ Tech Stack

<div align="center">

![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)
![TanStack](https://img.shields.io/badge/TanStack%20Start-FF4154?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS%204-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## 🏗️ Project Structure

```
zyvro-official/
├── 🎨 src/
│   ├── routes/              # Home, Shop, Product, About, Contact, Admin, Admin Login
│   ├── components/          # ProductCard, Footer, Badges, reusable UI (shadcn-based)
│   ├── lib/                 # admin, products, orders, size-guides, settings, csv, sku
│   └── integrations/
│       └── supabase/        # client, server client, auth middleware, generated types
├── 🗄️ supabase/
│   └── migrations/          # Products, orders, size guides, RLS policies
├── vite.config.ts           # TanStack Start + Nitro (Vercel preset)
└── package.json
```

---

## 🔄 How It Works

```mermaid
graph LR
    A[🛍️ Browse Product] -->|Select Color + Size| B[📏 Check Size Guide]
    B --> C[🟡 Click Order Now]
    C -->|Fill Delivery Details| D[🧾 Live Order Summary]
    D -->|Confirm Order| E[💾 Pending Order Saved]
    E -->|Pre-filled Message| F[💬 WhatsApp Opens]
    E -->|Real-time Push| G[🔔 Admin Notified]
    G -->|Confirm / Reject| H[📦 Order Lifecycle Tracked]
```

---

## ⚙️ Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/Nayeem131136/zyvro-official.git
cd zyvro-official

# 2. Install dependencies
npm install

# 3. Add your Supabase environment variables (create a .env file)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id

# 4. Run locally
npm run dev
```

---

## 🚀 Deploy Your Own

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit: ZYVRO"
git branch -M main
git remote add origin https://github.com/Nayeem131136/zyvro-official.git
git push -u origin main
```

Then on **[vercel.com/new](https://vercel.com/new)**:
1. Import the `zyvro-official` repo
2. Add the three Supabase environment variables under Project Settings
3. Click **Deploy** 🚀

Every push to `main` auto-redeploys. The build targets Vercel's Nitro preset out of the box.

---

## 🧭 Usage

| Step | Action |
|---|---|
| 1️⃣ | Customer browses Shop, opens a product, checks the Size Guide |
| 2️⃣ | Selects Color + Size, clicks **Order Now** |
| 3️⃣ | Fills name, phone, district, area, address in the order popup |
| 4️⃣ | Reviews the live order summary (subtotal + delivery + total) |
| 5️⃣ | Confirms — order is saved as Pending and WhatsApp opens pre-filled |
| 6️⃣ | Admin sees a real-time notification, then Confirms or Rejects the order |

---

## 🗺️ Roadmap

- [ ] SSLCommerz / bKash / Nagad payment integration (once order volume scales)
- [ ] Customer order-status lookup by phone number
- [ ] Bulk discount / coupon code system
- [ ] Multi-admin roles (staff accounts with limited permissions)

---

## 👤 Developer

<div align="center">

| Name | Role | GitHub |
|---|---|---|
| **Md. Mahdi Hasan Nayeem** | 🏆 Creator & Developer | [@Nayeem131136](https://github.com/Nayeem131136) |

**Portfolio:** [mahdi-hasan-nayeem-portfolio.vercel.app](https://mahdi-hasan-nayeem-portfolio.vercel.app/)

</div>

---

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0a0a,50:b8860b,100:0a0a0a&height=120&section=footer"/>

**⭐ Star this repo if it helped you! | 🍴 Fork to build your own**

[![GitHub stars](https://img.shields.io/github/stars/Nayeem131136/zyvro-official?style=social)](https://github.com/Nayeem131136/zyvro-official/stargazers)
&nbsp;
[![GitHub forks](https://img.shields.io/github/forks/Nayeem131136/zyvro-official?style=social)](https://github.com/Nayeem131136/zyvro-official/network/members)

*Built with 🖤 by Md. Mahdi Hasan Nayeem*

</div>
