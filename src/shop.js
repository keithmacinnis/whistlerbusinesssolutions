// Whistler storefront: loads products from the standalone commerce service and
// starts Stripe Checkout on "Buy Now". No on-site payment handling — Stripe hosts it.
// Update this URL after the commerce service's first Railway deploy.
const API_BASE = 'https://commerce-server-production.up.railway.app';
const STORE = 'whistler';

const formatPrice = (cents, currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: (currency || 'usd').toUpperCase() })
    .format((cents || 0) / 100);

const buyNow = async (productId, button) => {
  button.disabled = true;
  const original = button.textContent;
  button.textContent = 'Starting checkout…';
  try {
    const res = await fetch(`${API_BASE}/api/commerce/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store: STORE, productId }),
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
    card.innerHTML = `
      ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}" loading="lazy" style="width:100%;border-radius:8px;margin-bottom:1rem;">` : ''}
      <h3 class="theme-heading h3">${p.title}</h3>
      ${p.description ? `<p class="theme-text">${p.description}</p>` : ''}
      <p class="theme-text"><strong>${formatPrice(p.priceCents, p.currency)}</strong></p>
      <button class="theme-btn primary" type="button">Buy Now</button>
    `;
    card.querySelector('button').addEventListener('click', (e) => buyNow(p.id, e.currentTarget));
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
