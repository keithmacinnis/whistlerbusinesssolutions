// Whistler storefront: loads products from the standalone commerce service.
// Own merch goes through a client-side cart → Stripe Checkout (multi-item);
// affiliate products link out via tracked "Buy Direct" URLs.
// Reads VITE_COMMERCE_API_URL at build time; falls back to the API domain.
const RAW_API_BASE = import.meta.env.VITE_COMMERCE_API_URL || 'https://api.whistlerbusinesssolutions.com';
// Tolerate a protocol-less env value ("api.example.com") — without this the
// fetch URL is treated as a relative path and requests silently 404.
const API_BASE = /^https?:\/\//.test(RAW_API_BASE) ? RAW_API_BASE : `https://${RAW_API_BASE}`;
const STORE = 'whistler';
const CART_KEY = `wbs_cart_${STORE}`;

const formatPrice = (cents, currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: (currency || 'usd').toUpperCase() })
    .format((cents || 0) / 100);

// Voice-platform referral: /r/CODE links land here with ?ref=CODE. Keep it
// for the session so the eventual purchase gets attributed to that call.
const REF_KEY = 'wbs_ref';
try {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) sessionStorage.setItem(REF_KEY, ref.slice(0, 32));
} catch { /* storage unavailable — attribution is best-effort */ }

// ===== Cart state (localStorage: { [key]: quantity }) =====
// Keys are "productId" or "productId|variantId" when a size was chosen.

let productsById = {};

const keyParts = (key) => {
  const [productId, variantId] = key.split('|');
  return { productId, variantId: variantId || null };
};

const loadCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    return typeof cart === 'object' && cart ? cart : {};
  } catch {
    return {};
  }
};

const saveCart = (cart) => {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
  renderCartBar();
};

const setQty = (key, qty) => {
  const cart = loadCart();
  if (qty <= 0) delete cart[key];
  else cart[key] = Math.min(qty, 10);
  saveCart(cart);
  renderCartPanel();
};

const cartEntries = () =>
  Object.entries(loadCart()).filter(([key]) => productsById[keyParts(key).productId]);

const cartCount = () => cartEntries().reduce((n, [, q]) => n + q, 0);

const cartTotalCents = () =>
  cartEntries().reduce((sum, [key, q]) => sum + productsById[keyParts(key).productId].priceCents * q, 0);

// ===== Checkout =====

const checkout = async (button) => {
  const items = cartEntries().map(([key, quantity]) => {
    const { productId, variantId } = keyParts(key);
    return { productId, quantity, ...(variantId && { variantId }) };
  });
  if (!items.length) return;
  button.disabled = true;
  const original = button.textContent;
  button.textContent = 'Starting checkout…';
  try {
    let ref;
    try { ref = sessionStorage.getItem(REF_KEY) || undefined; } catch { /* ignore */ }
    const res = await fetch(`${API_BASE}/api/commerce/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store: STORE, items, ...(ref && { ref }) }),
    });
    if (!res.ok) throw new Error(`Checkout failed (${res.status})`);
    const { url } = await res.json();
    if (!url) throw new Error('No checkout URL returned');
    // Cart is cleared on the success page, so a canceled checkout keeps it.
    window.location.href = url;
  } catch (err) {
    console.error(err);
    button.disabled = false;
    button.textContent = original;
    alert('Sorry — we could not start checkout. Please try again.');
  }
};

// ===== Cart UI (floating bar + slide-over panel) =====

const cartBar = () => document.getElementById('cart-bar');
const cartPanel = () => document.getElementById('cart-panel');

const ensureCartElements = () => {
  if (cartBar()) return;
  const bar = document.createElement('div');
  bar.id = 'cart-bar';
  bar.style.cssText =
    'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:60;display:none;' +
    'background:#1f2937;color:#fff;border-radius:999px;padding:0.75rem 1.5rem;box-shadow:0 8px 24px rgba(0,0,0,0.25);cursor:pointer;font-weight:600;';
  bar.addEventListener('click', () => {
    renderCartPanel();
    cartPanel().style.display = 'flex';
  });
  document.body.appendChild(bar);

  const panel = document.createElement('div');
  panel.id = 'cart-panel';
  panel.style.cssText =
    'position:fixed;inset:0;z-index:70;display:none;justify-content:flex-end;background:rgba(0,0,0,0.4);';
  panel.addEventListener('click', (e) => {
    if (e.target === panel) panel.style.display = 'none';
  });
  const inner = document.createElement('div');
  inner.id = 'cart-panel-inner';
  inner.style.cssText =
    'width:min(420px,100%);height:100%;background:#fff;color:#111;padding:1.5rem;overflow-y:auto;display:flex;flex-direction:column;';
  panel.appendChild(inner);
  document.body.appendChild(panel);
};

const renderCartBar = () => {
  ensureCartElements();
  const count = cartCount();
  const bar = cartBar();
  if (!count) {
    bar.style.display = 'none';
    return;
  }
  bar.textContent = `🛒 ${count} item${count === 1 ? '' : 's'} · ${formatPrice(cartTotalCents())} — View cart`;
  bar.style.display = 'block';
};

const renderCartPanel = () => {
  ensureCartElements();
  const inner = document.getElementById('cart-panel-inner');
  const entries = cartEntries();
  if (!entries.length) {
    inner.innerHTML = '<p style="margin:auto;color:#6b7280;">Your cart is empty.</p>';
    return;
  }
  inner.innerHTML = `
    <h2 style="font-size:1.25rem;font-weight:700;margin:0 0 1rem;">Your cart</h2>
    <div id="cart-items" style="flex:1;"></div>
    <div style="border-top:1px solid #e5e7eb;padding-top:1rem;">
      <div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:1rem;">
        <span>Total</span><span>${formatPrice(cartTotalCents())}</span>
      </div>
      <button id="cart-checkout" class="theme-btn primary" style="width:100%;">Checkout</button>
      <p style="font-size:0.75rem;color:#9ca3af;margin-top:0.5rem;text-align:center;">Secure payment via Stripe · shipping calculated at checkout</p>
    </div>`;
  const list = inner.querySelector('#cart-items');
  entries.forEach(([key, qty]) => {
    const { productId, variantId } = keyParts(key);
    const p = productsById[productId];
    const size = variantId && (p.variants || []).find((v) => v.id === variantId)?.title;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:0.75rem;align-items:center;margin-bottom:1rem;';
    row.innerHTML = `
      ${p.imageUrl ? `<img src="${p.imageUrl}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px;">` : ''}
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:0.9rem;">${p.title}</div>
        <div style="color:#6b7280;font-size:0.85rem;">${formatPrice(p.priceCents, p.currency)}${size ? ` · ${size}` : ''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.4rem;">
        <button data-act="dec" style="width:26px;height:26px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;">−</button>
        <span style="min-width:1.2rem;text-align:center;">${qty}</span>
        <button data-act="inc" style="width:26px;height:26px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;">+</button>
      </div>`;
    row.querySelector('[data-act="dec"]').addEventListener('click', () => setQty(key, qty - 1));
    row.querySelector('[data-act="inc"]').addEventListener('click', () => setQty(key, qty + 1));
    list.appendChild(row);
  });
  inner.querySelector('#cart-checkout').addEventListener('click', (e) => checkout(e.currentTarget));
};

// ===== Product grid =====

const renderProducts = (products) => {
  const grid = document.getElementById('shop-grid');
  grid.innerHTML = '';
  products.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'theme-card';
    const isAffiliate = p.kind === 'affiliate';
    card.innerHTML = `
      ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}" loading="lazy" style="width:100%;border-radius:8px;margin-bottom:1rem;">` : ''}
      <h3 class="theme-heading h3">${p.title}</h3>
      ${p.description ? `<p class="theme-text">${p.description}</p>` : ''}
      ${p.priceCents != null ? `<p class="theme-text"><strong>${formatPrice(p.priceCents, p.currency)}</strong></p>` : ''}
      ${isAffiliate
        ? `<a class="theme-btn primary" href="${p.buyUrl}" target="_blank" rel="noopener sponsored">Buy Direct</a>
           ${p.partnerName ? `<p class="theme-text" style="font-size:0.8rem;opacity:0.7;margin-top:0.5rem;">Sold by ${p.partnerName}</p>` : ''}`
        : `${p.variants?.length
            ? `<select data-role="size" style="display:block;width:100%;margin-bottom:0.75rem;padding:0.5rem 0.75rem;border:1px solid #d1d5db;border-radius:8px;font-size:0.9rem;">
                 ${p.variants.map((v, i, arr) => `<option value="${v.id}" ${v.available ? '' : 'disabled'} ${v.available && arr.findIndex((x) => x.available) === i ? 'selected' : ''}>${v.title}${v.available ? '' : ' — sold out'}</option>`).join('')}
               </select>`
            : ''}
           <button class="theme-btn primary" type="button">Add to Cart</button>`}
    `;
    if (!isAffiliate) {
      card.querySelector('button').addEventListener('click', (e) => {
        let key = p.id;
        if (p.variants?.length) {
          const select = card.querySelector('[data-role="size"]');
          const variantId = select?.value || p.variants.find((v) => v.available)?.id;
          if (!variantId) return;
          key = `${p.id}|${variantId}`;
        }
        setQty(key, (loadCart()[key] || 0) + 1);
        const btn = e.currentTarget;
        btn.textContent = 'Added ✓';
        setTimeout(() => { btn.textContent = 'Add to Cart'; }, 1200);
      });
    }
    grid.appendChild(card);
  });
};

const init = async () => {
  const status = document.getElementById('shop-status');
  try {
    const res = await fetch(`${API_BASE}/api/commerce/products?store=${STORE}`);
    if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
    const { products } = await res.json();
    if (!products || products.length === 0) {
      status.textContent = 'New merch is on the way — check back soon!';
      return;
    }
    status.textContent = '';
    productsById = Object.fromEntries(products.filter((p) => p.kind !== 'affiliate').map((p) => [p.id, p]));
    renderProducts(products);
    renderCartBar();
  } catch (err) {
    console.error(err);
    status.textContent = 'We could not load the shop right now. Please try again later.';
  }
};

document.addEventListener('DOMContentLoaded', init);
