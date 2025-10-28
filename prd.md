Excellent — let’s write a **complete, investor-grade PRD (Product Requirements Document)** for your project **UAE Work Hub**, designed as a **career ecosystem platform** that unites **job discovery, coworking spaces, networking, and AI productivity tools** for the modern UAE workforce — freelancers, students, startups, and professionals alike.

---

# 🇦🇪 **UAE Work Hub — Product Requirements Document (PRD)**

**Version:** 1.0
**Date:** October 2025
**Author:** [Your Name]
**Product Owner:** [Your Name]
**Status:** MVP Planning

---

## 1. 🎯 Product Overview

### **Product Name:**

**UAE Work Hub**

### **Tagline:**

*“Your workspace, network, and next opportunity — all in one place.”*

### **Vision:**

To become the **#1 digital hub for professionals in the UAE** — merging job opportunities, coworking access, and AI-powered career tools into one unified ecosystem for seamless work and collaboration.

### **Mission:**

Empower every ambitious worker, student, or entrepreneur in the UAE to **find jobs, rent workspaces, connect with peers, and grow professionally** without leaving one platform.

---

## 2. 💡 Problem Statement

UAE workers and freelancers face fragmented systems:

* Job portals, coworking directories, and networking apps are **separate silos**.
* Remote workers & freelancers struggle to find **short-term office access**.
* Startups lack an integrated **talent + workspace + network** solution.
* Job seekers have no **AI-based career planner** tailored to UAE visas, job markets, and hiring rules.

**UAE Work Hub** unifies all these into one super-app.

---

## 3. 🧩 Core MVP Features

| Feature                        | Description                                                                            | Priority |
| ------------------------------ | -------------------------------------------------------------------------------------- | -------- |
| **1. Job Hub**                 | Aggregates UAE job postings (LinkedIn, Bayt, Indeed, Dubizzle Jobs) + AI skill matcher | ⭐️⭐️⭐️   |
| **2. Cowork Finder**           | Map of UAE coworking spaces + day-pass bookings                                        | ⭐️⭐️⭐️   |
| **3. AI Career Assistant**     | AI chatbot for CV review, career advice, and visa-specific guidance                    | ⭐️⭐️⭐️   |
| **4. Professional Networking** | “Local LinkedIn” feed for events, collabs, freelance offers                            | ⭐️⭐️     |
| **5. Workspace Booking**       | Book day/monthly desk slots at partner spaces                                          | ⭐️⭐️     |
| **6. AI Work Tools Suite**     | AI CV builder, cover letter writer, meeting summary tool                               | ⭐️⭐️     |
| **7. User Profile (Work ID)**  | Unified profile with skills, portfolio, visa type, availability                        | ⭐️⭐️⭐️   |
| **8. Event & Community Board** | Find local tech events, job fairs, and hackathons                                      | ⭐️⭐️     |
| **9. Smart Notifications**     | AI-curated jobs & workspace deals based on location                                    | ⭐️       |

---

## 4. 👥 User Personas

### 🧑‍💻 **Freelancer – Farid**

* Works from cafes in Dubai.
* Pain: Hard to find affordable day-pass spaces and clients.
* Goal: Discover spaces + gigs + build network.

### 👩‍💼 **Corporate Professional – Sara**

* Wants hybrid coworking options closer to home.
* Pain: No central database for flexible office passes.
* Goal: Book verified spaces instantly.

### 🧑‍🎓 **Student – Ahmed**

* Wants internships and tech events.
* Goal: AI-guided career path + connect to mentors.

### 👨‍🏢 **Startup Founder – Rashid**

* Needs to hire quickly and book meeting rooms for clients.
* Goal: Recruit + book workspace in one app.

---

## 5. ⚙️ Technical Architecture

### Frontend

* **Next.js 15** (App Router)
* **TailwindCSS + Shadcn UI**
* **Framer Motion** for animations
* **Mapbox GL** for cowork map
* **React Query / TanStack Query**

### Backend

* **Supabase** (Postgres + Auth + Storage)
* **Prisma ORM**
* **Edge Functions** for AI features and notifications
* **n8n / Zapier** integration for job API syncs

### AI Layer

* **OpenAI GPT-5** for: CV review, career chatbot, job matching
* **Embedding Search Model** for skills → job fit recommendations

### Hosting & DevOps

* **Vercel** (frontend) + **Supabase** (backend)
* **GitHub Actions** for CI/CD
* CRON jobs for job/cowork data refresh

---

## 6. 🔒 Security & Compliance

* OAuth Login (Google, Apple, LinkedIn)
* RLS per user in Supabase
* AES-256 encrypted storage for CVs and payment info
* GDPR + UAE Data Privacy Law 2023 compliant

---

## 7. 🗂️ Data Schema (Simplified)

**`users`**
id | name | email | role (freelancer, student, employer) | skills | visa_type | location | created_at

**`jobs`**
id | title | company | emirate | salary | visa_required | skills (array) | url | source | posted_at

**`cowork_spaces`**
id | name | location | price_per_day | features | verified | image_url | lat | lng

**`bookings`**
id | user_id | space_id | date | hours | payment_status

**`events`**
id | title | location | category | date | organizer | url

**`ai_sessions`**
id | user_id | prompt | response | type (cv, career, jobmatch) | timestamp

---

## 8. 📱 Core Screens

| Screen               | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| **Dashboard**        | AI overview of jobs, spaces, and events near you           |
| **Job Board**        | Aggregated listings with AI match score                    |
| **Cowork Map**       | Map of workspaces with filters (Emirate, price, amenities) |
| **Career Assistant** | Chatbot for CV feedback and job strategy                   |
| **Booking Page**     | Instant workspace booking                                  |
| **Profile Hub**      | Portfolio, skills, and AI-generated summary                |

---

## 9. 🚀 Success Metrics

| Metric                 | Target                   |
| ---------------------- | ------------------------ |
| Monthly Active Users   | 10 000 + within 3 months |
| Bookings per user      | ≥ 2 per month            |
| AI CV reviews          | 1 000 + per month        |
| Job click-through rate | > 20 %                   |
| User retention (M1→M2) | > 55 %                   |

---

## 10. 📅 Roadmap

| Phase                                    | Duration                                    | Deliverables |
| ---------------------------------------- | ------------------------------------------- | ------------ |
| **Phase 1 – MVP (6 weeks)**              | Job aggregator, cowork map, AI CV assistant |              |
| **Phase 2 – Bookings (3 weeks)**         | Payment gateway + workspace reservation     |              |
| **Phase 3 – Networking (4 weeks)**       | Profile hub + community feed                |              |
| **Phase 4 – AI Insights (4 weeks)**      | Job match scores + career analytics         |              |
| **Phase 5 – Recruiter Portal (5 weeks)** | Post jobs + AI screening                    |              |
| **Phase 6 – Mobile PWA (3 weeks)**       | Push notifications + offline mode           |              |

---

## 11. 💰 Monetization

| Tier                    | Features                                           | Price          |
| ----------------------- | -------------------------------------------------- | -------------- |
| **Free**                | Job search, basic AI assistant, view cowork spaces | AED 0          |
| **Pro (Individual)**    | Unlimited AI tools, priority workspace bookings    | AED 19.99 / mo |
| **Team Pro (Startup)**  | 5 users, shared booking dashboard                  | AED 99 / mo    |
| **Cowork Partner Plan** | Workspace owners list & manage inventory           | AED 199 / mo   |
| **Recruiter Plan**      | AI-filtered candidate dashboard                    | Custom pricing |

---

## 12. 🧭 Competitive Landscape

| Competitor | Weakness                          | UAE Work Hub Edge                       |
| ---------- | --------------------------------- | --------------------------------------- |
| LinkedIn   | No workspace or local integration | Unified job + cowork ecosystem          |
| Bayt       | Outdated UI + limited AI tools    | AI-driven career assistant              |
| LetsWork   | Only workspace booking            | Includes jobs + network                 |
| Teal       | Global-only                       | UAE-localized (visa, salary AED, zones) |

---

## 13. 🧠 Future Expansion

* **AI Skill Gap Analysis** → recommend courses from Udemy / Coursera UAE.
* **Visa & Document Tracker** → renewal reminders and status updates.
* **Corporate Perks Program** → discounts for cowork partners.
* **In-app Mentorship & Referrals.**
* **Arabic + English localization.**

---

## 14. 📈 Example User Flow

1. Sara signs in → AI detects “Marketing Professional in Dubai.”
2. Dashboard shows 3 nearby cowork spaces and 10 open jobs.
3. She books a day pass → receives discount via partner offer.
4. AI assistant reviews her CV and rewrites a LinkedIn headline.
5. Sara applies to jobs and joins a marketing event in Business Bay.
6. Work Hub tracks her progress and sends weekly career insights.

---

## 15. 📊 Success Criteria

✅ > 90 % accuracy in job skill matching.
✅ 500 + workspace partners onboarded in 6 months.
✅ 10 000 monthly active users within quarter 1.
✅ 50 % of users complete CV AI review workflow.

---

Would you like me to now generate:

* 🧱 **Production-ready repo structure** (Next.js 15 + Supabase + Prisma + OpenAI + Mapbox + Stripe for bookings), or
* 🧩 **ERD + API endpoint map** for UAE Work Hub?

Either will make it deploy-ready for **Vercel + Supabase** instantly.
