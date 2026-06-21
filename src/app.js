// Where every call-to-action button points. Change these in one place.
const CONTACT_EMAIL = 'keith@whistlerbusinesssolutions.com';
const REFERRAL_URL = 'https://www.whistler.com/'; // swap for the affiliate booking link once approved
// Button state: 'email' collects inquiries by email; switch to 'referral' when the
// Whistler.com affiliate booking link goes live.
const BUTTON_MODE = 'email';

document.addEventListener('DOMContentLoaded', () => {
  // Point every CTA at the current destination based on the button state
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

  // Apply saved theme from localStorage
  const savedTheme = localStorage.getItem('theme') || 'light';
  const body = document.body;
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    body.classList.remove('light-mode');
  } else {
    body.classList.add('light-mode');
    body.classList.remove('dark-mode');
  }
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const lightIcon = themeToggle.querySelector('.light-mode-icon');
    const darkIcon = themeToggle.querySelector('.dark-mode-icon');
    lightIcon.classList.toggle('hidden', savedTheme !== 'light');
    darkIcon.classList.toggle('hidden', savedTheme !== 'dark');
  }

  // Mobile Navigation
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

  // Theme toggle
  function toggleTheme() {
    body.classList.toggle('light-mode');
    body.classList.toggle('dark-mode');
    const lightIcon = themeToggle.querySelector('.light-mode-icon');
    const darkIcon = themeToggle.querySelector('.dark-mode-icon');
    lightIcon.classList.toggle('hidden');
    darkIcon.classList.toggle('hidden');
    const newTheme = body.classList.contains('light-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    console.log('Theme set to:', newTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
});

