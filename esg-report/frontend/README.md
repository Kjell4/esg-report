# ESG Reporting & Analytics Platform

Enterprise-grade ESG (Environmental, Social, Governance) reporting system for managing sustainability reports, analytics, and benchmarking.

**Live Demo:**  
https://esg-reporting-platform-project.vercel.app

---

## Overview

The ESG Reporting Platform is a secure desktop-first web application that allows organizations to:

- Complete ESG questionnaires
- Automatically calculate ESG scores
- View analytics dashboards
- Receive AI-based recommendations
- Export reports as editable files (DOCX / Text)

All users must be authenticated and access is controlled via role-based permissions.

---

## User Roles

### Administrator
- Manage users and companies
- Build questionnaires
- Configure ESG criteria
- View all reports and analytics

**Demo:**  
Email: `admin@esg.com`  
Password: `admin123`

---

### Respondent
- Create and complete ESG reports
- Save drafts and submit reports
- View dashboards and recommendations
- Export reports (DOCX / Text)

**Demo:**  
Email: `respondent@company.com`  
Password: `resp123`

---

### Viewer
- Read-only analytics access
- View reports and ESG rankings

**Demo:**  
Email: `viewer@esg.com`  
Password: `view123`

---

## ESG Scoring

```
Question Score = Answer × Weight
Category Score = Sum of category questions
Total ESG Score = Weighted average of E, S, G
```

| Score | Rating |
|------|------|
| 90–100 | Excellent |
| 80–89 | Good |
| 70–79 | Average |
| <70 | Needs Improvement |

---

## Tech Stack

- React 18
- React Router 7
- Vite
- Tailwind CSS 4
- Radix UI
- Recharts
- Lucide React Icons

---

## Project Structure

```
src/
 └── app/
     ├── components/
     ├── contexts/
     ├── pages/
     │   ├── admin/
     │   ├── respondent/
     │   └── viewer/
     ├── routes.tsx
     └── App.tsx
```

---

## Getting Started

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build production version:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

---

## Security

- Authentication required for all routes
- Role-Based Access Control (RBAC)
- Reports locked after submission
- Export restrictions enforced (no PDF)

---

**ESG Reporting Platform — 2026**
