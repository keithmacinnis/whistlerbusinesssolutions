document.addEventListener('DOMContentLoaded', () => {
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

  // Modal for Portfolio Items
  document.querySelectorAll('.portfolio-item').forEach(item => {
    item.addEventListener('click', () => {
      const modal = document.getElementById('modal');
      const modalTitle = document.getElementById('modal-title');
      const modalImage = document.getElementById('modal-image');
      const modalDescription = document.getElementById('modal-description');
      const modalLink = document.getElementById('modal-link');

      modalTitle.textContent = item.querySelector('.portfolio-text').textContent;
      modalImage.src = item.querySelector('img').dataset.src;
      modalDescription.textContent = item.getAttribute('aria-label');

      if (item.querySelector('.portfolio-text').textContent === 'Maisie Schedules') {
        modalLink.href = 'https://maisie-prod.whistlerbusinesssolutions.com/';
        modalLink.style.display = 'block';
      } else {
        modalLink.style.display = 'none';
      }
      modal.style.display = "block";
    });
  });

  // Close Modal
  const closeButton = document.querySelector('.close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      document.getElementById('modal').style.display = "none";
    });
  }

  const modal = document.getElementById('modal');
  if (modal) {
    window.addEventListener('click', event => {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    });
  }

  // Function to attach event listeners to service cards
  function attachCardListeners(card) {
    card.addEventListener('click', function(e) {
      // Check if click is on a link
      const link = e.target.closest('a');
      if (link) {
        console.log('Link clicked:', link.href);
        return; // Allow default link navigation
      }

      // Prevent default only for non-link clicks
      e.preventDefault();

      // Handle back button click
      if (e.target.closest('.back-to-front')) {
        const cardInner = card.querySelector('.card-inner');
        if (cardInner) {
          cardInner.classList.remove('is-flipped');
          console.log('Back button clicked, unflipped card');
        }
        return;
      }

      // Navigate if data-url exists and card is not flipped
      const url = this.getAttribute('data-url');
      const isFlipped = card.querySelector('.card-inner').classList.contains('is-flipped');
      if (url && !isFlipped) {
        console.log('Navigating to data-url:', url);
        window.location.href = url;
        return;
      }

      // Flip card for non-link, non-back-button clicks
      const cardInner = this.querySelector('.card-inner');
      if (cardInner) {
        cardInner.classList.toggle('is-flipped');
        console.log('Flipped card:', cardInner.classList.contains('is-flipped'));
      } else {
        console.warn('No .card-inner found in card:', this);
      }
    });

    // Handle "Learn More" button to trigger flip
    const learnMore = card.querySelector('.learn-more');
    if (learnMore) {
      learnMore.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        const cardInner = card.querySelector('.card-inner');
        if (cardInner) {
          cardInner.classList.toggle('is-flipped');
          console.log('Learn More clicked, flipped card:', cardInner.classList.contains('is-flipped'));
        }
      });
    }

    // Handle back button
    const backButton = card.querySelector('.back-to-front');
    if (backButton) {
      backButton.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        const cardInner = card.querySelector('.card-inner');
        if (cardInner) {
          cardInner.classList.remove('is-flipped');
          console.log('Back button clicked, unflipped card');
        }
      });
    }
  }

  // Attach listeners to service cards
  function initializeCardListeners() {
    document.querySelectorAll('.service-card').forEach(card => {
      if (!card.dataset.listenerAttached) {
        attachCardListeners(card);
        card.dataset.listenerAttached = 'true';
        console.log('Attached listener to card:', card.querySelector('h3').textContent);
      }
    });
  }

  initializeCardListeners();
  const observer = new MutationObserver(() => initializeCardListeners());
  observer.observe(document.body, { childList: true, subtree: true });

  // Load services from JSON
  const serviceGrid = document.getElementById('service-grid');
  if (serviceGrid && serviceGrid.children.length === 0) {
    fetch('services.json')
      .then(response => response.json())
      .then(data => {
        data.forEach(service => {
          const card = document.createElement('div');
          card.className = 'service-card';
          if (service.url) {
            card.setAttribute('data-url', service.url);
            console.log('Set data-url to', service.url);
          }
          card.innerHTML = `
            <div class="card-inner">
              <div class="card-front">
                <h3>${service.name}</h3>
                <p>${service.shortDescription}</p>
                <button class="learn-more">Learn More</button>
              </div>
              <div class="card-back">
                <h3>${service.name}</h3>
                <div class="back-content">${service.description}</div>
                <button class="back-to-front">Back</button>
              </div>
            </div>
          `;
          serviceGrid.appendChild(card);
          attachCardListeners(card);
        });
      })
      .catch(error => console.error('Error loading services:', error));
  }

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

  // Background image is now handled by CSS only
  
  // Remove the old Zendesk widget moving code - we're using the official API now
  // The button in the HTML uses: onclick="zE('messenger', 'show'); zE('messenger', 'open')"

  // Hide the Zendesk messenger widget on page load (required for new Web SDK)
  zE("messenger", "hide");
});

