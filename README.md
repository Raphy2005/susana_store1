# 🏪 Susana Store — Inventory & POS System

> Modern Filipino sari-sari store inventory system built with PHP, MySQL, HTML, CSS & JavaScript.

---

## 📁 File Structure

```
susana_store/
├── index.php          ← Main POS page (UI entry point)
├── api.php            ← All CRUD + stock API endpoints
├── config.php         ← Database credentials (edit this!)
├── database.sql       ← Run once to create DB & sample data
├── assets/
│   ├── css/style.css  ← All styles (warm Filipino theme)
│   └── js/app.js      ← All frontend logic (AJAX, cart, modals)
└── uploads/           ← Product images saved here (auto-created)
```

---

## ⚡ Setup Instructions

### Requirements
- **VS Code** with the PHP extension (optional but helpful)
- **XAMPP** (or WAMP / MAMP / Laragon)
- **PHP 7.4+** and **MySQL 5.7+**

---

### Step 1 — Install XAMPP
Download from: https://www.apachefriends.org/
- Start **Apache** and **MySQL** from the XAMPP Control Panel

---

### Step 2 — Copy project files
Place the `susana_store/` folder here:
```
C:\xampp\htdocs\susana_store\        ← Windows (XAMPP)
/opt/lampp/htdocs/susana_store/      ← Linux (XAMPP)
/Applications/XAMPP/htdocs/susana_store/  ← macOS (XAMPP)
```

---

### Step 3 — Create the Database
**Option A — phpMyAdmin (easiest):**
1. Open http://localhost/phpmyadmin
2. Click **Import** tab
3. Choose `database.sql` → click **Go**

**Option B — MySQL CLI:**
```bash
mysql -u root -p < database.sql
```

---

### Step 4 — Edit config.php
Open `config.php` in VS Code and update:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');      // your MySQL username
define('DB_PASS', '');          // your MySQL password (blank for XAMPP default)
define('DB_NAME', 'susana_store');
```

---

### Step 5 — Set uploads folder permission (Linux/macOS only)
```bash
chmod 755 uploads/
```
On Windows/XAMPP this is not needed.

---

### Step 6 — Open in browser
```
http://localhost/susana_store/
```

---

## ✅ Features

| Feature | Details |
|---|---|
| Product grid | Cards with image, price, stock badge |
| Category filter | Beverages, Snacks, Canned & Instant, Personal Care, Household |
| Live search | Filters products as you type |
| Image zoom | Click any product photo for a floating preview modal |
| Add product | With image upload (JPG, PNG, WEBP up to 5MB) |
| Edit product | Update name, price, stock, category, image |
| Delete product | Confirmation dialog + image file cleanup |
| Shopping cart | Add/remove items, quantity controls |
| VAT toggle | Optional 12% tax |
| Payment modal | Cash input + automatic change calculator |
| Stock deduction | After payment, MySQL stock is updated via transaction |
| Toast notifications | Friendly feedback on every action |

---

## 🔌 API Endpoints (api.php)

| Action | Method | Description |
|---|---|---|
| `list` | GET | List all or filtered products |
| `get` | GET | Get single product by `id` |
| `create` | POST | Add new product (supports image upload) |
| `update` | POST | Edit existing product (supports image swap) |
| `delete` | POST | Delete product + remove image file |
| `deduct_stock` | POST (JSON) | Deduct stock after payment (uses DB transaction) |

---

## 🎨 Design

- **Fonts:** Baloo 2 (display) + Nunito (body)
- **Colors:** Warm orange gradient navbar, cream background, green accents
- **Animations:** Spring card entrance, bounce hover lift, smooth modal zoom-in
- **Mobile:** Responsive grid, stacked layout on small screens
