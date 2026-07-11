// Whistler storefront: loads products from the standalone commerce service and
// starts Stripe Checkout on "Buy Now". No on-site payment handling — Stripe hosts it.
// Reads VITE_COMMERCE_API_URL at build time; falls back to the API domain.
const RAW_API_BASE = import.meta.env.VITE_COMMERCE_API_URL || 'https://api.whistlerbusinesssolutions.com';
// Tolerate a protocol-less env value ("api.example.com") — without this the
// fetch URL is treated as a relative path and requests silently 404.
const API_BASE = /^https?:\/\//.test(RAW_API_BASE) ? RAW_API_BASE : `https://${RAW_API_BASE}`;
const STORE = 'whistler';

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

const buyNow = async (productId, button) => {
  button.disabled = true;
  const original = button.textContent;
  button.textContent = 'Starting checkout…';
  try {
    let ref;
    try { ref = sessionStorage.getItem(REF_KEY) || undefined; } catch { /* ignore */ }
    const res = await fetch(`${API_BASE}/api/commerce/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store: STORE, productId, ...(ref && { ref }) }),
    });
    if (!res.ok) throw new Error(`Checkout failed (${res.status})`);
    const { url } = await res.json();
    if (!url) throw new Error('No checkout URL returned');
    window.location.href = url;
  } catch (err) {
    console.error(err);
    button.disabled = false;
    button.textContent = original;
    alert('Sorry — we could not start checkout. Please try again.');
  }
};

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
        : `<button class="theme-btn primary" type="button">Buy Now</button>`}
    `;
    if (!isAffiliate) {
      card.querySelector('button').addEventListener('click', (e) => buyNow(p.id, e.currentTarget));
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
    renderProducts(products);
  } catch (err) {
    console.error(err);
    status.textContent = 'We could not load the shop right now. Please try again later.';
  }
};

document.addEventListener('DOMContentLoaded', init);
