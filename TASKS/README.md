# Centrifungal - Task Index

| Task ID | Title | Phase | Agent | Priority | Effort | Dependencies | Status |
|---|---|---|---|---|---|---|---|
| 001 | Repository Setup | 1 | architect | High | S | none | TODO |
| 002 | Netlify Configuration | 1 | architect | High | S | TASK-001 | TODO |
| 003 | Railway Configuration | 1 | architect | High | M | TASK-001 | TODO |
| 004 | Confirm Persistent Volume | 1 | architect | High | S | TASK-003 | TODO |
| 005 | Litestream Setup - Continuous Replication to R2 | 2 | architect | High | M | TASK-004 | TODO |
| 006 | SQLite Backup Cron - Daily Offsite Copy | 1 | architect | High | M | TASK-004 | TODO |
| 007 | DNS and Domain Setup | 3 | architect | Medium | S | TASK-002, TASK-003 | TODO |
| 008 | Security Headers (CSP, HSTS, etc.) | 3 | architect | Medium | S | TASK-002, TASK-003 | TODO |
| 009 | Smoke Tests - End-to-End Launch Checklist | 5 | architect | High | M | TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008 | TODO |
| 100 | Laravel 12 Scaffold with Statamic 6 | 1 | backend | High | M | none | TODO |
| 101 | SQLite Database Schema | 1 | backend | High | M | TASK-100 | TODO |
| 102 | WAL Mode Configuration | 1 | backend | High | S | TASK-101 | TODO |
| 103 | Product API Endpoints | 2 | backend | High | M | TASK-101, TASK-102 | TODO |
| 104 | Cart API Endpoints | 2 | backend | High | M | TASK-101, TASK-102 | TODO |
| 105 | Stripe Checkout Session Creation | 2 | backend | High | M | TASK-104 | TODO |
| 106 | Stripe Webhook Handler | 2 | backend | High | L | TASK-105 | TODO |
| 107 | Order Fulfilment Flow | 3 | backend | High | M | TASK-106, TASK-108 | TODO |
| 108 | Royal Mail Click & Drop API Integration | 3 | backend | High | L | TASK-100 | TODO |
| 109 | Royal Mail Tracking Poller | 3 | backend | Medium | M | TASK-108 | TODO |
| 110 | Resend Email - Order Confirmation | 3 | backend | Medium | M | TASK-106 | TODO |
| 111 | Resend Email - Shipping Notification | 3 | backend | Medium | S | TASK-110, TASK-109 | TODO |
| 112 | Auth - Admin Session for Statamic CMS | 1 | backend | High | S | TASK-100 | TODO |
| 113 | API Rate Limiting | 2 | backend | Medium | S | TASK-100 | TODO |
| 114 | Stripe Reconciliation Cron | 4 | backend | Medium | M | TASK-106 | TODO |
| 115 | Contact Form Endpoint | 2 | backend | Low | S | TASK-101, TASK-110 | TODO |
| 200 | Design System - Colour Palette, Typography, Spacing | 1 | frontend | High | M | none | TODO |
| 201 | Component Library - Base Components | 1 | frontend | High | L | TASK-200 | TODO |
| 202 | Homepage Template | 2 | frontend | High | M | TASK-201 | TODO |
| 203 | Product Listing Page | 2 | frontend | High | M | TASK-201 | TODO |
| 204 | Product Detail Page (Variant Selector) | 2 | frontend | High | L | TASK-201, TASK-205 | TODO |
| 205 | Cart UI (localStorage, Add/Remove/Update) | 2 | frontend | High | L | TASK-201 | TODO |
| 206 | Checkout Flow (Stripe Redirect) | 3 | frontend | High | M | TASK-205 | TODO |
| 207 | Care Instructions Page | 3 | frontend | Medium | S | TASK-201 | TODO |
| 208 | About Page | 3 | frontend | Medium | S | TASK-201 | TODO |
| 209 | Contact Page (Form UI) | 3 | frontend | Medium | M | TASK-201 | TODO |
| 210 | FAQ Page | 3 | frontend | Low | S | TASK-201 | TODO |
| 211 | Order Confirmation / Thank You Page | 3 | frontend | High | S | TASK-206 | TODO |
| 212 | SEO - Meta Tags, Open Graph, Structured Data | 4 | frontend | Medium | M | TASK-202, TASK-203, TASK-204 | TODO |
| 213 | Performance Pass - Lighthouse 90+ | 5 | frontend | Medium | M | TASK-202, TASK-203, TASK-204, TASK-212 | TODO |
| 214 | Responsive Design - Mobile-First | 5 | frontend | High | M | TASK-202, TASK-203, TASK-204, TASK-205, TASK-207, TASK-208, TASK-209, TASK-210, TASK-211 | TODO |
| 300 | Statamic 6 CMS Configuration | 3 | cms | High | M | none | TODO |
| 301 | Bard Block Types Configuration | 3 | cms | High | L | TASK-300 | TODO |
| 302 | Product Collection Blueprint | 3 | cms | High | M | TASK-300 | TODO |
| 303 | Product Management UX | 3 | cms | Medium | S | TASK-302 | TODO |
| 304 | Page Blueprints | 3 | cms | High | M | TASK-301 | TODO |
| 305 | Image Upload Handling | 3 | cms | High | M | TASK-300 | TODO |
| 306 | Navigation Management | 3 | cms | Medium | S | TASK-304 | TODO |
| 307 | Order Visibility in CMS Admin | 3 | cms | Medium | M | TASK-300 | TODO |
| 308 | Contact Form Submissions in CMS Admin | 3 | cms | Medium | S | TASK-300, TASK-304 | TODO |
| 309 | Owner Runbook | 3 | cms | High | M | TASK-301, TASK-302, TASK-303, TASK-304, TASK-306, TASK-307, TASK-308 | TODO |
