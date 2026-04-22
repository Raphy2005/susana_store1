'use strict';

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const CAT_EMOJI = {
  'Beverages':             '🥤',
  'Snacks':                '🍟',
  'Canned & Instant Foods':'🥫',
  'Personal Care':         '🧴',
  'Household Supplies':    '🧹',
  'Other':                 '📦',
};

/* ═══════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

function fmt(n) {
  return '₱' + parseFloat(n).toLocaleString('en-PH', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function toast(msg, type = 'info') {
  const stack = $('toastStack');
  const el = document.createElement('div');
  el.className = `toast-item toast-${type}`;
  el.textContent = msg;
  stack.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 380);
  }, 3000);
}

function lockBody()   { document.body.style.overflow = 'hidden'; }
function unlockBody() { document.body.style.overflow = ''; }

/* ═══════════════════════════════════════════════
   API WRAPPER
═══════════════════════════════════════════════ */
const API = {
  async get(action, params = {}) {
    const url = new URL('api.php', location.href);
    url.searchParams.set('action', action);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res  = await fetch(url);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Request failed');
    return data;
  },

  async post(action, formData) {
    formData.append('action', action);
    const res  = await fetch('api.php', { method: 'POST', body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Request failed');
    return data;
  },

  async postJSON(action, body) {
    const res  = await fetch(`api.php?action=${action}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Request failed');
    return data;
  },
};

/* ═══════════════════════════════════════════════
   PRODUCT STATE & RENDERING
═══════════════════════════════════════════════ */
let allProducts = [];
let currentCat  = 'All Items';

async function loadProducts() {
  $('loadingState').style.display  = 'flex';
  $('productGrid').innerHTML       = '';
  $('emptyState').style.display    = 'none';

  try {
    const data  = await API.get('list');
    allProducts = data.products;
    renderProducts();
  } catch (e) {
    toast('Failed to load products: ' + e.message, 'danger');
  } finally {
    $('loadingState').style.display = 'none';
  }
}

function renderProducts() {
  const q    = $('searchQ').value.trim().toLowerCase();
  const list = allProducts.filter(p =>
    (currentCat === 'All Items' || p.category === currentCat) &&
    (!q || p.product_name.toLowerCase().includes(q))
  );

  $('panelCount').textContent = `${list.length} product${list.length !== 1 ? 's' : ''}`;

  if (!list.length) {
    $('productGrid').innerHTML = '';
    $('emptyState').style.display = 'block';
    return;
  }
  $('emptyState').style.display = 'none';

  $('productGrid').innerHTML = list.map((p, i) => {
    const out   = p.stock <= 0;
    const low   = p.stock > 0 && p.stock <= 5;
    const sc    = out ? 'stk-out' : low ? 'stk-low' : 'stk-ok';
    const sl    = out ? 'Out of stock' : low ? `${p.stock} left` : `${p.stock} in stock`;
    const emoji = CAT_EMOJI[p.category] || '📦';
    const imgEl = p.image
      ? `<div class="pcard-img-wrap" onclick="Lightbox.open(${p.id})" style="animation-delay:${i * 25}ms">
           <img src="${esc(p.image)}" alt="${esc(p.product_name)}" loading="lazy">
         </div>`
      : `<div class="pcard-emoji" onclick="Lightbox.open(${p.id})">${emoji}</div>`;

    return `
    <div class="pcard" style="animation-delay:${i * 35}ms">
      <span class="pcard-cat-badge">${emoji} ${(p.category || '').split(' ')[0]}</span>
      ${imgEl}
      <div class="pcard-body">
        <div class="pcard-name">${esc(p.product_name)}</div>
        <div class="pcard-meta">
          <span class="pcard-price">${fmt(p.price)}</span>
          <span class="stk-pill ${sc}">${sl}</span>
        </div>
      </div>
      <div class="pcard-actions">
        <button class="btn-cart" onclick="Cart.add(${p.id})" ${out ? 'disabled' : ''}>
          🛒 Add
        </button>
        <button class="btn-ic edit" onclick="App.openEdit(${p.id})" title="Edit">✏️</button>
        <button class="btn-ic del"  onclick="App.openDel(${p.id})"  title="Delete">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

/* Category tabs */
$('catBar').addEventListener('click', e => {
  const btn = e.target.closest('.cat-btn');
  if (!btn) return;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCat = btn.dataset.cat;
  const titles = {
    'All Items':             '🏪 All Items',
    'Beverages':             '🥤 Beverages',
    'Snacks':                '🍟 Snacks',
    'Canned & Instant Foods':'🥫 Canned & Instant',
    'Personal Care':         '🧴 Personal Care',
    'Household Supplies':    '🧹 Household Supplies',
  };
  $('panelTitle').textContent = titles[currentCat] || currentCat;
  renderProducts();
});

/* Search */
let _searchTimer;
$('searchQ').addEventListener('input', () => {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(renderProducts, 220);
});

/* ═══════════════════════════════════════════════
   LIGHTBOX
═══════════════════════════════════════════════ */
const Lightbox = (() => {
  let _pid = null;

  function open(id) {
    const p = allProducts.find(x => x.id == id);
    if (!p) return;
    _pid = id;

    const wrap = $('lbImgWrap');
    if (p.image) {
      wrap.innerHTML = `<img src="${esc(p.image)}" alt="${esc(p.product_name)}">`;
      wrap.style.fontSize = '';
    } else {
      wrap.innerHTML    = CAT_EMOJI[p.category] || '📦';
      wrap.style.fontSize = '80px';
    }

    $('lbName').textContent = p.product_name;
    $('lbPrice').textContent = fmt(p.price);

    const out = p.stock <= 0, low = p.stock > 0 && p.stock <= 5;
    const sc  = out ? 'stk-out' : low ? 'stk-low' : 'stk-ok';
    const sl  = out ? 'Out of stock' : low ? `${p.stock} left` : `${p.stock} in stock`;
    $('lbMeta').innerHTML = `
      <span class="lb-price">${fmt(p.price)}</span>
      <span class="stk-pill ${sc}">${sl}</span>`;

    const btn = $('lbAddBtn');
    btn.disabled    = out;
    btn.textContent = out ? 'Out of stock' : '🛒 Add to Cart';
    btn.onclick     = () => { Cart.add(id); forceClose(); };

    $('lbBackdrop').classList.add('open');
    lockBody();
    document.addEventListener('keydown', _onKey);
  }

  function close(e) {
    if (e && e.target !== $('lbBackdrop')) return;
    forceClose();
  }

  function forceClose() {
    $('lbBackdrop').classList.remove('open');
    unlockBody();
    document.removeEventListener('keydown', _onKey);
    _pid = null;
  }

  function _onKey(e) { if (e.key === 'Escape') forceClose(); }

  // Prevent inner card click from bubbling to backdrop
  $('lbCard').addEventListener('click', e => e.stopPropagation());

  return { open, close, forceClose };
})();

/* ═══════════════════════════════════════════════
   CART
═══════════════════════════════════════════════ */
const Cart = (() => {
  let items = {};   // { productId: { product, qty } }

  function add(id) {
    const p = allProducts.find(x => x.id == id);
    if (!p || p.stock <= 0) return;

    if (items[id]) {
      if (items[id].qty >= p.stock) {
        toast(`Max stock reached! Only ${p.stock} available 📦`, 'danger');
        return;
      }
      items[id].qty++;
    } else {
      items[id] = { product: p, qty: 1 };
    }
    _render();
    toast(`${p.product_name} added to cart! 🛒`, 'success');
  }

  function changeQty(id, delta) {
    if (!items[id]) return;
    items[id].qty += delta;
    if (items[id].qty <= 0)                       delete items[id];
    else if (items[id].qty > items[id].product.stock) items[id].qty = items[id].product.stock;
    _render();
  }

  function clear() { items = {}; _render(); }
  function getAll(){ return items; }

  function _render() {
    const keys  = Object.keys(items);
    const body  = $('cartBody');
    const empty = $('cartEmpty');
    $('cartBadge').textContent = keys.reduce((s, k) => s + items[k].qty, 0);

    if (!keys.length) {
      body.innerHTML = '';
      body.appendChild(empty);
      empty.style.display = 'block';
      recalc();
      return;
    }
    empty.style.display = 'none';

    body.innerHTML = keys.map(id => {
      const { product: p, qty } = items[id];
      const imgEl = p.image
        ? `<div class="ci-img"><img src="${esc(p.image)}" alt="${esc(p.product_name)}"></div>`
        : `<div class="ci-img">${CAT_EMOJI[p.category] || '📦'}</div>`;
      return `
      <div class="cart-item">
        ${imgEl}
        <div class="ci-info">
          <div class="ci-name">${esc(p.product_name)}</div>
          <div class="ci-price">${fmt(parseFloat(p.price) * qty)}</div>
        </div>
        <div class="qty-ctrl">
          <button class="qty-btn" onclick="Cart.changeQty(${id}, -1)">−</button>
          <span class="qty-n">${qty}</span>
          <button class="qty-btn" onclick="Cart.changeQty(${id},  1)">+</button>
        </div>
      </div>`;
    }).join('');

    recalc();
  }

  function recalc() {
    const sub   = Object.values(items).reduce((s, { product: p, qty }) => s + parseFloat(p.price) * qty, 0);
    const vat   = $('vatChk').checked ? sub * 0.12 : 0;
    const total = sub + vat;
    $('cfSub').textContent   = fmt(sub);
    $('cfVat').textContent   = fmt(vat);
    $('cfTotal').textContent = fmt(total);
    $('btnPay').disabled     = !Object.keys(items).length;
    return { sub, vat, total };
  }

  return { add, changeQty, clear, getAll, recalc };
})();

/* ═══════════════════════════════════════════════
   APP — CRUD
═══════════════════════════════════════════════ */
let _pendingImg = null;
let _editingId  = null;
let _deletingId = null;

const App = (() => {

  /* ── open ADD form ── */
  function openAdd() {
    _editingId = null;
    _pendingImg = null;
    $('formTitle').textContent  = 'Add New Product';
    $('btnSaveTxt').textContent = '💾 Save Product';
    $('fId').value    = '';
    $('fName').value  = '';
    $('fPrice').value = '';
    $('fStock').value = '';
    $('fCat').value   = 'Beverages';
    _resetUpload();
    _open('prodModal');
  }

  /* ── open EDIT form ── */
  async function openEdit(id) {
    try {
      const data = await API.get('get', { id });
      const p    = data.product;
      _editingId  = p.id;
      _pendingImg = p.image || null;

      $('formTitle').textContent  = 'Edit Product';
      $('btnSaveTxt').textContent = '💾 Update Product';
      $('fId').value    = p.id;
      $('fName').value  = p.product_name;
      $('fPrice').value = p.price;
      $('fStock').value = p.stock;
      $('fCat').value   = p.category;

      if (p.image) {
        const prev = $('imgPreview');
        prev.src = p.image;
        prev.style.display = 'block';
        $('uploadPlaceholder').style.display = 'none';
      } else {
        _resetUpload();
      }
      _open('prodModal');
    } catch (e) {
      toast('Could not load product: ' + e.message, 'danger');
    }
  }

  /* ── preview selected image ── */
  function previewImg(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      _pendingImg = e.target.result;
      const prev = $('imgPreview');
      prev.src = _pendingImg;
      prev.style.display = 'block';
      $('uploadPlaceholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  /* ── save (create or update) ── */
  async function save() {
    const name  = $('fName').value.trim();
    const price = $('fPrice').value;
    const stock = $('fStock').value;
    if (!name)  { toast('Product name is required ⚠️', 'danger'); return; }
    if (!price) { toast('Price is required ⚠️', 'danger'); return; }
    if (!stock) { toast('Stock is required ⚠️', 'danger'); return; }

    const btn = $('btnSave');
    btn.disabled = true;
    $('btnSaveTxt').textContent = 'Saving…';

    const fd = new FormData();
    fd.append('product_name', name);
    fd.append('price',        price);
    fd.append('stock',        stock);
    fd.append('category',     $('fCat').value);
    if (_editingId) fd.append('id', _editingId);

    const imgFile = $('fImage').files[0];
    if (imgFile) fd.append('image', imgFile);

    try {
      const action = _editingId ? 'update' : 'create';
      await API.post(action, fd);
      closeForm();
      toast(_editingId ? 'Product updated! ✅' : 'Product added! 🎉', 'success');
      await loadProducts();
    } catch (e) {
      toast(e.message, 'danger');
    } finally {
      btn.disabled = false;
      $('btnSaveTxt').textContent = _editingId ? '💾 Update Product' : '💾 Save Product';
    }
  }

  /* ── open DELETE confirm ── */
  function openDel(id) {
    const p = allProducts.find(x => x.id == id);
    if (!p) return;
    _deletingId = id;
    $('delProductName').textContent = p.product_name;
    _open('delModal');
  }

  /* ── confirm DELETE ── */
  async function confirmDelete() {
    if (!_deletingId) return;
    const btn = $('btnDelConfirm');
    btn.disabled = true;

    const fd = new FormData();
    fd.append('id', _deletingId);
    try {
      await API.post('delete', fd);
      // Remove from cart too
      delete Cart.getAll()[_deletingId];
      Cart.recalc();
      closeDel();
      toast('Product deleted 🗑️', 'info');
      await loadProducts();
      Cart.changeQty(_deletingId, 0);   // force re-render
    } catch (e) {
      toast(e.message, 'danger');
    } finally {
      btn.disabled = false;
      _deletingId  = null;
    }
  }

  /* ── helpers ── */
  function closeForm() { _close('prodModal'); }
  function closeDel()  { _close('delModal');  }

  function modalClick(e, id) {
    if (e.target === $(id)) {
      if (id === 'prodModal') closeForm();
      else if (id === 'delModal') closeDel();
    }
  }

  function _open(id)  { $(id).classList.add('open');    lockBody(); }
  function _close(id) { $(id).classList.remove('open'); unlockBody(); }

  function _resetUpload() {
    $('imgPreview').style.display        = 'none';
    $('imgPreview').src                  = '';
    $('uploadPlaceholder').style.display = '';
    $('fImage').value                    = '';
    _pendingImg = null;
  }

  return { openAdd, openEdit, previewImg, save, openDel, confirmDelete, closeForm, closeDel, modalClick };
})();

/* ═══════════════════════════════════════════════
   PAYMENT
═══════════════════════════════════════════════ */
const Payment = (() => {

  function open() {
    const { sub, vat, total } = Cart.recalc();
    const items = Cart.getAll();

    $('receiptBody').innerHTML =
      '<div class="receipt-header">🧾 Order Summary</div>' +
      Object.values(items).map(({ product: p, qty }) =>
        `<div class="receipt-row">
           <span>${esc(p.product_name)} ×${qty}</span>
           <span>${fmt(parseFloat(p.price) * qty)}</span>
         </div>`
      ).join('') +
      `<div class="receipt-div"></div>
       <div class="receipt-row muted"><span>Subtotal</span><span>${fmt(sub)}</span></div>` +
      (vat ? `<div class="receipt-row muted"><span>VAT (12%)</span><span>${fmt(vat)}</span></div>` : '') +
      `<div class="receipt-div"></div>
       <div class="receipt-row receipt-total"><span>💰 Total</span><span>${fmt(total)}</span></div>`;

    $('cashIn').value          = '';
    $('cashIn').dataset.total  = total;
    $('changeAmt').textContent = '₱0.00';

    $('payModal').classList.add('open');
    lockBody();
  }

  function calcChange() {
    const total = parseFloat($('cashIn').dataset.total || 0);
    const cash  = parseFloat($('cashIn').value         || 0);
    $('changeAmt').textContent = cash >= total ? fmt(cash - total) : '₱0.00';
  }

  async function confirm() {
    const total = parseFloat($('cashIn').dataset.total || 0);
    const cash  = parseFloat($('cashIn').value         || 0);
    if (cash < total) { toast('Cash is less than the total! 💸', 'danger'); return; }

    // Build items list
    const items = Object.entries(Cart.getAll()).map(([id, { qty }]) => ({
      id: parseInt(id), qty,
    }));

    const btn = $('btnPayConfirm');
    btn.disabled        = true;
    btn.textContent     = 'Processing…';

    try {
      await API.postJSON('deduct_stock', { items });
      close();
      Cart.clear();
      toast('Payment confirmed! Salamat! 🎉', 'success');
      await loadProducts();
    } catch (e) {
      toast('Payment error: ' + e.message, 'danger');
    } finally {
      btn.disabled    = false;
      btn.textContent = '✅ Confirm Payment';
    }
  }

  function close()      { $('payModal').classList.remove('open'); unlockBody(); }
  function modalClick(e){ if (e.target === $('payModal')) close(); }

  return { open, calcChange, confirm, close, modalClick };
})();

/* ═══════════════════════════════════════════════
   GLOBAL ESCAPE KEY
═══════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('lbBackdrop').classList.contains('open')) { Lightbox.forceClose(); return; }
  if ($('prodModal').classList.contains('open'))  { App.closeForm();       return; }
  if ($('delModal').classList.contains('open'))   { App.closeDel();        return; }
  if ($('payModal').classList.contains('open'))   { Payment.close();       return; }
});

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', loadProducts);
