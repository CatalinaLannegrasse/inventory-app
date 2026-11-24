// db/populatedb.js
const { Client } = require("pg");
require("dotenv").config();

const SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  website VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name, description) VALUES
  ('Keyboards', 'Mechanical, low-profile, wireless, and custom keyboards'),
  ('Monitors', 'Gaming, ultrawide, and color-accurate productivity displays'),
  ('Audio', 'Headphones, earbuds, DACs/amps, and streaming microphones'),
  ('Mice & Peripherals', 'Wireless mice, desk mats, webcams, and ergonomic accessories'),
  ('Cables & Hubs', 'USB-C docks, Thunderbolt cables, adapters, and chargers')
ON CONFLICT (name) DO NOTHING;

INSERT INTO brands (name, website) VALUES
  ('Keychron', 'https://www.keychron.com'),
  ('LG', 'https://www.lg.com'),
  ('Sony', 'https://www.sony.com'),
  ('Logitech', 'https://www.logitech.com'),
  ('Anker', 'https://www.anker.com')
ON CONFLICT (name) DO NOTHING;

INSERT INTO items (sku, name, description, price, quantity, category_id, brand_id)
SELECT
  v.sku,
  v.name,
  v.description,
  v.price,
  v.quantity,
  c.id,
  b.id
FROM (
  VALUES
    ('KB-K2P-001', 'Keychron K2 Pro', '75% wireless mechanical keyboard, hot-swappable, QMK/VIA', 99.00, 14, 'Keyboards', 'Keychron'),
    ('KB-Q1H-002', 'Keychron Q1 Pro', '75% aluminum gasket-mount wireless mechanical keyboard', 199.00, 4, 'Keyboards', 'Keychron'),
    ('MON-27GP-003', 'LG UltraGear 27"', '27-inch QHD Nano IPS monitor, 165Hz, 1ms', 299.99, 8, 'Monitors', 'LG'),
    ('MON-34WK-004', 'LG UltraWide 34"', '34-inch WQHD curved IPS display with USB-C', 479.00, 2, 'Monitors', 'LG'),
    ('AUD-XM5-005', 'Sony WH-1000XM5', 'Wireless noise-canceling over-ear headphones', 349.00, 6, 'Audio', 'Sony'),
    ('AUD-LNK-006', 'Sony LinkBuds S', 'Lightweight wireless noise-canceling earbuds', 149.99, 0, 'Audio', 'Sony'),
    ('MSE-MX3S-007', 'Logitech MX Master 3S', 'Ergonomic wireless mouse with 8,000 DPI quiet clicks', 99.99, 18, 'Mice & Peripherals', 'Logitech'),
    ('HUB-777-008', 'Anker 777 Thunderbolt Hub', '12-in-1 Thunderbolt 4 dock with 90W laptop charging', 229.99, 5, 'Cables & Hubs', 'Anker'),
    ('CHG-65W-009', 'Anker Nano II 65W Charger', 'Compact GaN II USB-C fast charger for laptops & phones', 39.99, 25, 'Cables & Hubs', 'Anker')
) AS v(sku, name, description, price, quantity, category_name, brand_name)
JOIN categories c ON c.name = v.category_name
LEFT JOIN brands b ON b.name = v.brand_name
ON CONFLICT (sku) DO NOTHING;
`;

async function seed() {
  const connectionString = process.argv[2] || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing connection string. Pass one as an argument or set DATABASE_URL in .env.");
    process.exit(1);
  }

  const useSsl =
    process.env.DATABASE_SSL === "true" ||
    /sslmode=require/i.test(connectionString);

  console.log("Connecting to PostgreSQL and seeding tech store data...");
  const client = new Client({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    await client.query(SQL);
    console.log("Seed completed successfully!");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seed();