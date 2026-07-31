import { BOOKING_LINKS, whistlerStaysLink } from './affiliates/booking.js';

// Legacy email/referral switch kept for pages that still use data-referral.
const CONTACT_EMAIL = 'keith@whistlerbusinesssolutions.com';
const REFERRAL_URL = 'https://www.whistler.com/';
const BUTTON_MODE = 'email';

document.addEventListener('DOMContentLoaded', () => {
  const mailto = `mailto:${CONTACT_EMAIL}?subject=Whistler%20Retreat%20Inquiry`;
  document.querySelectorAll('a[data-referral]').forEach(link => {
    if (BUTTON_MODE === 'referral') {
      link.href = REFERRAL_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else {
      link.href = mailto;
      link.removeAttribute('target');
      link.removeAttribute('rel');
    }
  });

  // Booking.com CJ affiliate — primary conversion path for stays + travel add-ons.
  // Whistler stays CTAs prefer the store's dashboard-assigned CTA product (tracked /r/ link);
  // hardcoded evergreen deep links remain the fallback until that loads.
  const RAW_API = import.meta.env.VITE_COMMERCE_API_URL || 'https://api.whistlerbusinesssolutions.com';
  const API_BASE = /^https?:\/\//.test(RAW_API) ? RAW_API : `https://${RAW_API}`;
  const STORE = 'whistler';

  const bookingHref = {
    whistler: (sid) => whistlerStaysLink(sid),
    cta: (sid) => whistlerStaysLink(sid),
    flights: () => BOOKING_LINKS.flights,
    cars: () => BOOKING_LINKS.cars,
    attractions: () => BOOKING_LINKS.attractions,
    taxis: () => BOOKING_LINKS.taxis,
    getaway: () => BOOKING_LINKS.getawayDeals,
    homepage: () => BOOKING_LINKS.homepage,
  };

  const wireBookingLink = (link, href, kind, sid) => {
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer sponsored';
    if (link.dataset.bookingWired) return;
    link.dataset.bookingWired = '1';
    link.addEventListener('click', () => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'booking_affiliate_click', {
          booking_kind: kind,
          booking_sid: sid,
        });
      }
    });
  };

  document.querySelectorAll('a[data-booking]').forEach((link) => {
    const kind = link.dataset.booking;
    const sid = link.dataset.bookingSid || 'wbs';
    const resolve = bookingHref[kind];
    if (!resolve) return;
    wireBookingLink(link, resolve(sid), kind, sid);
  });

  // Overlay primary stay CTAs with the store CTA product when configured in the dashboard.
  fetch(`${API_BASE}/api/commerce/products?store=${STORE}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const buyUrl = data?.cta?.buyUrl;
      if (!buyUrl) return;
      document.querySelectorAll('a[data-booking="whistler"], a[data-booking="cta"]').forEach((link) => {
        const sid = link.dataset.bookingSid || 'wbs';
        wireBookingLink(link, buyUrl, 'cta', sid);
      });
    })
    .catch(() => { /* keep hardcoded Booking fallbacks */ });

  // Mobile Navigation
  const body = document.body;
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
  const mobileNavClose = document.querySelector('.mobile-nav-close');
  const servicesToggle = document.querySelector('.services-toggle');

  function openMobileNav() {
    hamburgerMenu.classList.add('active');
    mobileNav.classList.add('active');
    mobileNavOverlay.classList.add('active');
    body.classList.add('mobile-nav-open');
  }

  function closeMobileNav() {
    hamburgerMenu.classList.remove('active');
    mobileNav.classList.remove('active');
    mobileNavOverlay.classList.remove('active');
    body.classList.remove('mobile-nav-open');
  }

  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', openMobileNav);
  }

  if (mobileNavClose) {
    mobileNavClose.addEventListener('click', closeMobileNav);
  }

  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener('click', closeMobileNav);
  }

  // Services submenu toggle in mobile nav
  if (servicesToggle) {
    servicesToggle.addEventListener('click', () => {
      servicesToggle.classList.toggle('active');
      const subMenu = servicesToggle.nextElementSibling;
      if (subMenu) {
        subMenu.classList.toggle('active');
      }
    });
  }

  // Close mobile nav when clicking on a link
  const mobileNavLinks = document.querySelectorAll('.mobile-nav a');
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMobileNav();
    });
  });

  // Close mobile nav on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
      closeMobileNav();
    }
  });

  // Remove loader once the page is loaded
  setTimeout(() => {
    document.getElementById('loader').style.display = 'none';
  }, 1000);

  // Services menu hover and touch handling
  document.querySelectorAll('.services-menu').forEach(menu => {
    menu.addEventListener('mouseenter', () => {
      menu.classList.add('active');
    });
    menu.addEventListener('mouseleave', () => {
      menu.classList.remove('active');
    });
    menu.addEventListener('touchstart', (e) => {
      e.preventDefault();
      menu.classList.toggle('active');
    });
    document.addEventListener('touchstart', (e) => {
      if (!menu.contains(e.target)) {
        menu.classList.remove('active');
      }
    });
  });

  // Lazy Loading Images
  const lazyImages = document.querySelectorAll("img[data-src]:not(#hero-background img)");
  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.removeAttribute("data-src");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });
    lazyImages.forEach(lazyImage => lazyImageObserver.observe(lazyImage));
  } else {
    lazyImages.forEach(lazyImage => {
      lazyImage.src = lazyImage.dataset.src;
      lazyImage.removeAttribute("data-src");
    });
  }

  // Smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector(anchor.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Scroll reveal
  function reveal() {
    const reveals = document.querySelectorAll('.section');
    reveals.forEach(reveal => {
      const windowHeight = window.innerHeight;
      const elementTop = reveal.getBoundingClientRect().top;
      if (elementTop < windowHeight - 150) {
        reveal.classList.add('reveal');
      }
    });
  }
  window.addEventListener('scroll', reveal);
});

