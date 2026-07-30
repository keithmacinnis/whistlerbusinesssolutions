// Landing-page teaser for the shop: pulls a few live products so visitors
// see real gift cards before clicking through to the full store.
// Read-only — no cart/checkout logic here, every card links to shop.html.
const RAW_API_BASE = import.meta.env.VITE_COMMERCE_API_URL || 'https://api.whistlerbusinesssolutions.com';
const API_BASE = /^https?:\/\//.test(RAW_API_BASE) ? RAW_API_BASE : `https://${RAW_API_BASE}`;
const STORE = 'whistler';

// Prefer these brands (case-insensitive title match), in this order.
// Edit this list to change what shows in the landing-page shop preview.
// Prefer specific needles — short ones like "tim" also match inside "Ultimate".
const PREVIEW_TITLE_MATCHERS = ['uber', 'tim®', 'walmart'];

const formatPrice = (cents, currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: (currency || 'usd').toUpperCase() })
    .format((cents || 0) / 100);

const titleMatches = (title, needle) => {
  const t = title.toLowerCase();
  const n = needle.toLowerCase();
  if (t.includes(n)) return true;
  // Short alphabetic needles need a token boundary so "tim" ≠ "Ultimate"
  if (/^[a-z]+$/i.test(needle) && needle.length <= 4) {
    return new RegExp(`(?:^|[^a-z0-9])${needle}(?:[^a-z0-9]|$)`, 'i').test(title);
  }
  return false;
};

const pickPreviewProducts = (products) => {
  const withImage = (products || []).filter((p) => p.imageUrl && p.title);
  const picked = [];
  const used = new Set();

  for (const needle of PREVIEW_TITLE_MATCHERS) {
    const match = withImage.find((p) => !used.has(p.id) && titleMatches(p.title, needle));
    if (match) {
      picked.push(match);
      used.add(match.id);
    }
  }

  return picked;
};

const init = async () => {
  const grid = document.getElementById('shop-preview-grid');
  if (!grid) return;
  const section = grid.closest('section');
  try {
    const res = await fetch(`${API_BASE}/api/commerce/products?store=${STORE}`);
    if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
    const { products } = await res.json();
    const items = pickPreviewProducts(products);
    if (!items.length) {
      if (section) section.style.display = 'none';
      return;
    }
    grid.innerHTML = items.map((p) => `
      <a class="shop-preview-card" href="shop.html">
        <div class="shop-card-media">
          <img src="${p.imageUrl}" alt="${p.title}" loading="lazy">
        </div>
        <div class="shop-preview-card-body">
          <p class="shop-preview-card-title">${p.title}</p>
          ${p.priceCents != null ? `<p class="shop-preview-card-price">${formatPrice(p.priceCents, p.currency)}</p>` : ''}
        </div>
      </a>
    `).join('');
  } catch (err) {
    console.error(err);
    if (section) section.style.display = 'none';
  }
};

document.addEventListener('DOMContentLoaded', init);
