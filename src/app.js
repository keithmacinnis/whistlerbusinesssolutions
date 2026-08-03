import { BOOKING_LINKS, bookingDeepLink, whistlerStaysLink } from './affiliates/booking.js';
import { captureEvent } from './analytics.js';

// Legacy email/referral switch kept for pages that still use data-referral.
const CONTACT_EMAIL = 'keith@whistlerbusinesssolutions.com';
const REFERRAL_URL = 'https://www.whistler.com/';
const BUTTON_MODE = 'email';

document.addEventListener('DOMContentLoaded', () => {
  const syncRainbowRails = () => {
    const header = document.querySelector('header');
    if (!header) return;
    // Track the bar's viewport Y so rails grow upward on scroll and stay attached.
    const top = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
    document.documentElement.style.setProperty('--rainbow-rail-top', `${top}px`);
  };
  syncRainbowRails();
  window.addEventListener('resize', syncRainbowRails);
  window.addEventListener('scroll', syncRainbowRails, { passive: true });

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
  // Dashboard CTA slots (cta-1 … cta-10) overlay these when assigned on the store.
  const RAW_API = import.meta.env.VITE_COMMERCE_API_URL || 'https://api.whistlerbusinesssolutions.com';
  const API_BASE = /^https?:\/\//.test(RAW_API) ? RAW_API : `https://${RAW_API}`;
  const STORE = 'whistler';

  // Hero search: pass dates, adults, children/ages, and rooms into Booking.com's search URL,
  // then wrap that destination in the CJ evergreen affiliate deep link.
  const bookingForm = document.getElementById('hero-booking-form');
  const checkinInput = document.getElementById('hero-checkin');
  const checkoutInput = document.getElementById('hero-checkout');
  const adultsInput = document.getElementById('hero-adults');
  const childrenInput = document.getElementById('hero-children');
  const roomsInput = document.getElementById('hero-rooms');
  const guestsToggle = document.getElementById('hero-guests-toggle');
  const guestsPopover = document.getElementById('hero-guests-popover');
  const guestsDone = document.getElementById('hero-guests-done');
  const childAgesContainer = document.getElementById('hero-child-ages');
  const adultsCount = document.getElementById('hero-adults-count');
  const childrenCount = document.getElementById('hero-children-count');
  const roomsCount = document.getElementById('hero-rooms-count');

  const dateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (
    bookingForm && checkinInput && checkoutInput && adultsInput && childrenInput && roomsInput
    && guestsToggle && guestsPopover && guestsDone && childAgesContainer
    && adultsCount && childrenCount && roomsCount
  ) {
    const guestState = {
      adults: 2,
      children: 0,
      rooms: 1,
      ages: [],
    };

    const plural = (count, singular, pluralForm = `${singular}s`) =>
      `${count} ${count === 1 ? singular : pluralForm}`;

    const renderChildAges = () => {
      childAgesContainer.replaceChildren();
      guestState.ages.forEach((age, index) => {
        const label = document.createElement('label');
        label.className = 'hero-child-age';
        label.htmlFor = `hero-child-age-${index}`;

        const text = document.createElement('span');
        text.textContent = `Child ${index + 1} age at check-out`;

        const select = document.createElement('select');
        select.id = `hero-child-age-${index}`;
        select.name = 'childAge';
        select.setAttribute('aria-label', `Child ${index + 1} age at check-out`);
        for (let years = 0; years <= 17; years += 1) {
          const option = document.createElement('option');
          option.value = String(years);
          option.textContent = years === 0
            ? 'Under 1 year old'
            : `${years} ${years === 1 ? 'year' : 'years'} old`;
          option.selected = years === age;
          select.append(option);
        }
        select.addEventListener('change', () => {
          guestState.ages[index] = Number(select.value);
        });

        label.append(text, select);
        childAgesContainer.append(label);
      });
    };

    const syncGuestUi = () => {
      adultsInput.value = String(guestState.adults);
      childrenInput.value = String(guestState.children);
      roomsInput.value = String(guestState.rooms);
      adultsCount.textContent = String(guestState.adults);
      childrenCount.textContent = String(guestState.children);
      roomsCount.textContent = String(guestState.rooms);

      const parts = [plural(guestState.adults, 'adult')];
      if (guestState.children) parts.push(plural(guestState.children, 'child', 'children'));
      parts.push(plural(guestState.rooms, 'room'));
      guestsToggle.textContent = parts.join(' · ');

      const limits = {
        'adults-minus': guestState.adults <= 1,
        'adults-plus': guestState.adults >= 20,
        'children-minus': guestState.children <= 0,
        'children-plus': guestState.children >= 10,
        'rooms-minus': guestState.rooms <= 1,
        'rooms-plus': guestState.rooms >= 10,
      };
      Object.entries(limits).forEach(([action, disabled]) => {
        const button = guestsPopover.querySelector(`[data-guest-action="${action}"]`);
        if (button) button.disabled = disabled;
      });
      renderChildAges();
    };

    const closeGuests = () => {
      guestsPopover.hidden = true;
      guestsToggle.setAttribute('aria-expanded', 'false');
    };

    guestsToggle.addEventListener('click', () => {
      const opening = guestsPopover.hidden;
      guestsPopover.hidden = !opening;
      guestsToggle.setAttribute('aria-expanded', String(opening));
    });
    guestsDone.addEventListener('click', () => {
      closeGuests();
      guestsToggle.focus();
    });
    guestsPopover.addEventListener('click', (event) => {
      const button = event.target.closest('[data-guest-action]');
      if (!button) return;
      const action = button.dataset.guestAction;
      if (action === 'adults-minus') guestState.adults = Math.max(1, guestState.adults - 1);
      if (action === 'adults-plus') guestState.adults = Math.min(20, guestState.adults + 1);
      if (action === 'children-minus') {
        guestState.children = Math.max(0, guestState.children - 1);
        guestState.ages = guestState.ages.slice(0, guestState.children);
      }
      if (action === 'children-plus') {
        guestState.children = Math.min(10, guestState.children + 1);
        while (guestState.ages.length < guestState.children) guestState.ages.push(0);
      }
      if (action === 'rooms-minus') guestState.rooms = Math.max(1, guestState.rooms - 1);
      if (action === 'rooms-plus') guestState.rooms = Math.min(10, guestState.rooms + 1);
      syncGuestUi();
    });
    document.addEventListener('click', (event) => {
      if (!guestsPopover.hidden && !event.target.closest('.hero-guests-field')) closeGuests();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !guestsPopover.hidden) {
        closeGuests();
        guestsToggle.focus();
      }
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultCheckout = new Date(tomorrow);
    defaultCheckout.setDate(defaultCheckout.getDate() + 3);

    checkinInput.min = dateInputValue(tomorrow);
    checkinInput.value = dateInputValue(tomorrow);
    checkoutInput.min = dateInputValue(defaultCheckout);
    checkoutInput.value = dateInputValue(defaultCheckout);

    checkinInput.addEventListener('change', () => {
      if (!checkinInput.value) return;
      const nextDay = new Date(`${checkinInput.value}T12:00:00`);
      nextDay.setDate(nextDay.getDate() + 1);
      const minimumCheckout = dateInputValue(nextDay);
      checkoutInput.min = minimumCheckout;
      if (!checkoutInput.value || checkoutInput.value <= checkinInput.value) {
        checkoutInput.value = minimumCheckout;
      }
    });

    bookingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      checkoutInput.setCustomValidity('');
      if (!checkinInput.value || !checkoutInput.value) {
        bookingForm.reportValidity();
        return;
      }
      if (checkoutInput.value <= checkinInput.value) {
        checkoutInput.setCustomValidity('Check-out must be after check-in.');
        checkoutInput.reportValidity();
        return;
      }

      const destination = new URL('https://www.booking.com/searchresults.html');
      destination.searchParams.set('ss', 'Whistler, British Columbia, Canada');
      destination.searchParams.set('dest_type', 'city');
      destination.searchParams.set('checkin', checkinInput.value);
      destination.searchParams.set('checkout', checkoutInput.value);
      destination.searchParams.set('group_adults', adultsInput.value);
      destination.searchParams.set('group_children', childrenInput.value);
      guestState.ages.forEach((age) => destination.searchParams.append('age', String(age)));
      destination.searchParams.set('no_rooms', roomsInput.value);
      destination.searchParams.set('selected_currency', 'CAD');
      destination.searchParams.set('lang', 'en-ca');

      const analyticsProperties = {
        booking_kind: 'hero_search',
        booking_sid: 'wbs-hero-search',
        checkin: checkinInput.value,
        checkout: checkoutInput.value,
        adults: adultsInput.value,
        children: childrenInput.value,
        rooms: roomsInput.value,
      };
      captureEvent('booking_affiliate_click', analyticsProperties);
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'booking_affiliate_click', analyticsProperties);
      }
      window.open(bookingDeepLink(destination.toString(), 'wbs-hero-search'), '_blank', 'noopener,noreferrer');
    });

    syncGuestUi();
  }

  const ctaFallback = {
    1: (sid) => whistlerStaysLink(sid),
    2: () => BOOKING_LINKS.flights,
    3: () => BOOKING_LINKS.cars,
    4: () => BOOKING_LINKS.attractions,
    5: () => 'shop.html',
  };

  const bookingHref = {
    whistler: (sid) => whistlerStaysLink(sid),
    cta: (sid) => whistlerStaysLink(sid),
    'cta-1': (sid) => whistlerStaysLink(sid),
    'cta-2': () => BOOKING_LINKS.flights,
    'cta-3': () => BOOKING_LINKS.cars,
    'cta-4': () => BOOKING_LINKS.attractions,
    'cta-5': () => 'shop.html',
    flights: () => BOOKING_LINKS.flights,
    cars: () => BOOKING_LINKS.cars,
    attractions: () => BOOKING_LINKS.attractions,
    taxis: () => BOOKING_LINKS.taxis,
    getaway: () => BOOKING_LINKS.getawayDeals,
    homepage: () => BOOKING_LINKS.homepage,
  };

  const wireBookingLink = (link, href, kind, sid) => {
    link.href = href;
    if (href === 'shop.html' || href.startsWith('/') || href.endsWith('shop.html')) {
      link.removeAttribute('target');
      link.removeAttribute('rel');
    } else {
      link.target = '_blank';
      link.rel = 'noopener noreferrer sponsored';
    }
    if (link.dataset.bookingWired) return;
    link.dataset.bookingWired = '1';
    link.addEventListener('click', () => {
      const analyticsProperties = {
        booking_kind: kind,
        booking_sid: sid,
        link_text: link.textContent.trim(),
      };
      captureEvent('booking_affiliate_click', analyticsProperties);
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'booking_affiliate_click', analyticsProperties);
      }
    });
  };

  const bookingSlot = (kind) => {
    if (kind === 'whistler' || kind === 'cta') return 1;
    const m = /^cta-(\d+)$/.exec(kind || '');
    return m ? Number(m[1]) : null;
  };

  document.querySelectorAll('a[data-booking]').forEach((link) => {
    const kind = link.dataset.booking;
    const sid = link.dataset.bookingSid || 'wbs';
    const slot = bookingSlot(kind);
    const resolve = bookingHref[kind] || (slot && ctaFallback[slot]);
    if (!resolve) return;
    wireBookingLink(link, resolve(sid), kind, sid);
  });

  // Overlay CTA slots with dashboard-assigned affiliate products when present.
  fetch(`${API_BASE}/api/commerce/products?store=${STORE}`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const ctas = { ...(data?.ctas || {}) };
      if (data?.cta && !ctas['1']) ctas['1'] = data.cta;

      document.querySelectorAll('a[data-booking]').forEach((link) => {
        const kind = link.dataset.booking;
        const slot = bookingSlot(kind);
        if (!slot) return;
        const product = ctas[String(slot)];
        if (!product?.buyUrl) return;
        const sid = link.dataset.bookingSid || 'wbs';
        wireBookingLink(link, product.buyUrl, `cta-${slot}`, sid);
        if (link.dataset.bookingLabel === String(slot) || link.dataset.bookingLabel === 'cta') {
          const label = (product.ctaLabel || product.title || '').trim();
          if (!label) return;
          const arrow = link.textContent.includes('→') ? ' →' : '';
          link.textContent = `${label}${arrow}`;
        }
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

