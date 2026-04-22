<?php
$logoPath = __DIR__ . '/assets/logo.png';
$logoB64  = file_exists($logoPath)
    ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
    : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Susana Store — Inventory & POS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
<?php if ($logoB64): ?>
<link rel="icon" type="image/png" href="assets/logo.png">
<?php endif; ?>
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

<!-- ══ NAVBAR ══════════════════════════════════════════════════ -->
<nav class="navbar">
  <a class="brand" href="#">
    <?php if ($logoB64): ?>
      <img src="<?= $logoB64 ?>" alt="Susana Store" class="brand-logo">
    <?php else: ?>
      <div class="brand-icon">🏪</div>
    <?php endif; ?>
    <div class="brand-text">
      <span class="brand-name">Susana Store</span>
      <span class="brand-sub">INVENTORY &amp; POS SYSTEM</span>
    </div>
  </a>

  <div class="search-wrap">
    <span class="search-icon">🔍</span>
    <input type="text" id="searchQ" class="search-input" placeholder="Search products...">
  </div>

  <button class="btn-add" onclick="App.openAdd()">
    <span class="plus-icon">+</span> Add New Product
  </button>
</nav>

<!-- ══ CATEGORY BAR ════════════════════════════════════════════ -->
<div class="cat-bar" id="catBar">
  <button class="cat-btn active" data-cat="All Items">🏪 All Items</button>
  <button class="cat-btn" data-cat="Beverages">🥤 Beverages</button>
  <button class="cat-btn" data-cat="Snacks">🍟 Snacks</button>
  <button class="cat-btn" data-cat="Canned &amp; Instant Foods">🥫 Canned &amp; Instant</button>
  <button class="cat-btn" data-cat="Personal Care">🧴 Personal Care</button>
  <button class="cat-btn" data-cat="Household Supplies">🧹 Household Supplies</button>
</div>

<!-- ══ MAIN BODY ════════════════════════════════════════════════ -->
<div class="pos-body">

  <!-- Products Panel -->
  <section class="products-panel">
    <div class="panel-header">
      <span class="panel-title" id="panelTitle">🏪 All Items</span>
      <span class="panel-count" id="panelCount"></span>
    </div>
    <div id="loadingState" class="loading-state">
      <div class="spinner"></div>
      <span>Loading products…</span>
    </div>
    <div class="product-grid" id="productGrid"></div>
    <div class="empty-state" id="emptyState" style="display:none">
      <div class="empty-icon">🔍</div>
      <p>No products found</p>
    </div>
  </section>

  <!-- Cart Panel -->
  <aside class="cart-panel">
    <div class="cart-head">
      <div class="cart-title">
        🛒 Current Order
        <span class="cart-badge" id="cartBadge">0</span>
      </div>
      <button class="btn-clear" onclick="Cart.clear()">Clear</button>
    </div>
    <div class="cart-body" id="cartBody">
      <div class="cart-empty" id="cartEmpty">
        <span class="ce-icon">🛍️</span>
        No items yet.<br>Add products to start an order!
      </div>
    </div>
    <div class="cart-foot">
      <div class="cf-row"><span>Subtotal</span><span id="cfSub">₱0.00</span></div>
      <div class="cf-row">
        <label><input type="checkbox" id="vatChk" onchange="Cart.recalc()"> VAT (12%)</label>
        <span id="cfVat">₱0.00</span>
      </div>
      <div class="cf-total">
        <span class="cf-total-label">💰 Total</span>
        <span class="cf-total-amt" id="cfTotal">₱0.00</span>
      </div>
      <button class="btn-pay" id="btnPay" disabled onclick="Payment.open()">
        ✅ Proceed to Payment
      </button>
    </div>
  </aside>
</div>

<!-- ══ IMAGE LIGHTBOX ══════════════════════════════════════════ -->
<div class="lb-backdrop" id="lbBackdrop" onclick="Lightbox.close(event)">
  <div class="lb-card" id="lbCard">
    <button class="lb-close" onclick="Lightbox.forceClose()">✕</button>
    <div class="lb-img-wrap" id="lbImgWrap"></div>
    <div class="lb-name" id="lbName"></div>
    <div class="lb-meta" id="lbMeta"></div>
    <button class="lb-add-btn" id="lbAddBtn">🛒 Add to Cart</button>
  </div>
</div>

<!-- ══ PRODUCT FORM MODAL ═══════════════════════════════════════ -->
<div class="modal-backdrop" id="prodModal" onclick="App.modalClick(event,'prodModal')">
  <div class="modal-card">
    <div class="modal-title">
      <div class="mt-icon">📦</div>
      <span id="formTitle">Add New Product</span>
    </div>
    <input type="hidden" id="fId">

    <div class="form-field">
      <label>Product Photo</label>
      <div class="img-upload" id="imgUpload" onclick="document.getElementById('fImage').click()">
        <img id="imgPreview" class="upload-preview" style="display:none" src="" alt="">
        <div id="uploadPlaceholder">
          <span style="font-size:32px">📷</span>
          <span class="upload-text">Click to upload photo</span>
          <span class="upload-sub">JPG, PNG, WEBP • max 5MB</span>
        </div>
        <input type="file" id="fImage" accept="image/*" onchange="App.previewImg(this)">
      </div>
    </div>

    <div class="form-field">
      <label>Product Name *</label>
      <input type="text" id="fName" placeholder="e.g. Coke Mismo">
    </div>
    <div class="form-row">
      <div class="form-field">
        <label>Price (₱) *</label>
        <input type="number" id="fPrice" min="0" step="0.01" placeholder="0.00">
      </div>
      <div class="form-field">
        <label>Stock (qty) *</label>
        <input type="number" id="fStock" min="0" placeholder="0">
      </div>
    </div>
    <div class="form-field">
      <label>Category</label>
      <select id="fCat">
        <option>Beverages</option>
        <option>Snacks</option>
        <option>Canned &amp; Instant Foods</option>
        <option>Personal Care</option>
        <option>Household Supplies</option>
        <option>Other</option>
      </select>
    </div>

    <div class="modal-btns">
      <button class="btn-modal-cancel" onclick="App.closeForm()">Cancel</button>
      <button class="btn-modal-save" id="btnSave" onclick="App.save()">
        <span id="btnSaveTxt">💾 Save Product</span>
      </button>
    </div>
  </div>
</div>

<!-- ══ DELETE MODAL ════════════════════════════════════════════ -->
<div class="modal-backdrop" id="delModal" onclick="App.modalClick(event,'delModal')">
  <div class="del-card">
    <div class="del-icon">🗑️</div>
    <div class="del-title">Delete Product?</div>
    <div class="del-msg">
      Are you sure you want to delete<br>
      <strong id="delProductName"></strong>?<br>
      <small>This action cannot be undone.</small>
    </div>
    <div class="modal-btns">
      <button class="btn-modal-cancel" onclick="App.closeDel()">Cancel</button>
      <button class="btn-del-confirm" id="btnDelConfirm" onclick="App.confirmDelete()">🗑️ Delete</button>
    </div>
  </div>
</div>

<!-- ══ PAYMENT MODAL ═══════════════════════════════════════════ -->
<div class="modal-backdrop" id="payModal" onclick="Payment.modalClick(event)">
  <div class="pay-card">
    <div class="pay-title">💳 Payment</div>
    <div class="receipt" id="receiptBody"></div>
    <div class="cash-label">Cash Received (₱)</div>
    <input type="number" class="cash-input" id="cashIn" placeholder="0.00" oninput="Payment.calcChange()">
    <div class="change-box">
      <span class="change-label">💵 Change</span>
      <span class="change-amt" id="changeAmt">₱0.00</span>
    </div>
    <div class="modal-btns" style="margin-top:18px">
      <button class="btn-modal-cancel" onclick="Payment.close()">Cancel</button>
      <button class="btn-pay-confirm" id="btnPayConfirm" onclick="Payment.confirm()">✅ Confirm Payment</button>
    </div>
  </div>
</div>

<!-- Toast container -->
<div class="toast-stack" id="toastStack"></div>

<script src="assets/js/app.js"></script>
</body>
</html>
