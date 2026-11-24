# Tech Stock — Tech Store Inventory Application

A server-rendered inventory management web application for a tech hardware store, built with **Node.js**, **Express**, **EJS**, and **PostgreSQL** as part of [The Odin Project](https://www.theodinproject.com/) NodeJS curriculum.

---

## Features

- **Full CRUD Management:** Create, browse, inspect, update, and delete tech products (`items`), product departments (`categories`), and hardware manufacturers (`brands`).
- **Relational Data Integrity:** Enforces unique SKUs, non-negative prices and stock quantities (`CHECK` constraints), and foreign-key rules (`ON DELETE RESTRICT` for categories with active items, `ON DELETE SET NULL` for optional brands).
- **Stock-Level Visibility:** Automatically surfaces stock status badges (In Stock, Low Stock, Out of Stock) and calculates total inventory valuation per SKU.
- **Protected Destructive Actions:** Requires a server-side admin password (`ADMIN_PASSWORD`) verified via constant-time comparison (`crypto.timingSafeEqual`) before saving edits or deleting records.
- **Idempotent Database Seeding:** Includes a standalone `db/populatedb.js` script to initialize tables and populate realistic tech store sample inventory locally or in production.

---

## Tech Stack

- **Runtime & Framework:** Node.js, Express
- **Templating:** EJS
- **Database:** PostgreSQL (`pg` connection pool)
- **Styling:** Custom CSS (Apple-inspired dark UI)

---

## Database Schema

```text
categories (1) ──────< items >────── (0..1) brands