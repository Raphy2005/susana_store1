-- ─────────────────────────────────────────────
--  SUSANA STORE — Database Setup
--  Run this once in phpMyAdmin or MySQL CLI:
--  mysql -u root -p < database.sql
-- ─────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS susana_store
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE susana_store;

CREATE TABLE IF NOT EXISTS products (
    id           INT          AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    price        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock        INT          NOT NULL DEFAULT 0,
    category     VARCHAR(100) NOT NULL DEFAULT 'Other',
    image        VARCHAR(255) DEFAULT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Sample Products ────────────────────────────────────────────────
INSERT INTO products (product_name, price, stock, category) VALUES
('Coke Mismo',              18.00, 48, 'Beverages'),
('Royal Tru-Orange',        18.00, 36, 'Beverages'),
('C2 Green Tea',            25.00, 24, 'Beverages'),
('Mineral Water',           12.00, 60, 'Beverages'),
('Sting Energy Drink',      25.00, 20, 'Beverages'),
('SkyFlakes',               10.00, 30, 'Snacks'),
('Mr. Chips',               20.00, 25, 'Snacks'),
('Clover Chips',            10.00,  4, 'Snacks'),
('Nova',                    25.00, 15, 'Snacks'),
('Piattos',                 22.00, 18, 'Snacks'),
('Lucky Me Pancit Canton',  16.00, 40, 'Canned & Instant Foods'),
('Lucky Me Instant Mami',   16.00, 35, 'Canned & Instant Foods'),
('Cup Noodles',             33.00, 12, 'Canned & Instant Foods'),
('Alaska Condensed Milk',   30.00, 18, 'Canned & Instant Foods'),
('Hunt\'s Pork & Beans',   35.00, 10, 'Canned & Instant Foods'),
('Lorins Patis',            25.00,  3, 'Canned & Instant Foods'),
('Safeguard Bar',           28.00, 20, 'Personal Care'),
('Colgate 75mL',            45.00, 15, 'Personal Care'),
('Rejoice Sachet',           6.00, 50, 'Personal Care'),
('Head & Shoulders Sachet',  8.00, 40, 'Personal Care'),
('Champion Detergent',      12.00, 30, 'Household Supplies'),
('Ariel Sachet',            12.00, 28, 'Household Supplies'),
('Baygon Spray',            85.00,  8, 'Household Supplies'),
('Domex Bleach',            55.00, 10, 'Household Supplies');
