document.addEventListener('DOMContentLoaded', () => {
  // Remove loader once the page is loaded
  setTimeout(() => {
    document.getElementById('loader').style.display = 'none';
  }, 1000); // Simulate loading time

  // Lazy Loading Images - exclude the hero background
  const lazyImages = document.querySelectorAll("img[data-src]:not(#hero-background img)");
  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          lazyImage.removeAttribute("data-src");
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    lazyImages.forEach(function(lazyImage) {
      lazyImage.src = lazyImage.dataset.src;
      lazyImage.removeAttribute("data-src");
    });
  }

  // Smooth scrolling for internal links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Scroll reveal for sections
  function reveal() {
    const reveals = document.querySelectorAll('.section');
    for (let i = 0; i < reveals.length; i++) {
      const windowHeight = window.innerHeight;
      const elementTop = reveals[i].getBoundingClientRect().top;
      const elementVisible = 150;

      if (elementTop < windowHeight - elementVisible) {
        reveals[i].classList.add('reveal');
      }
    }
  }
  window.addEventListener('scroll', reveal);

  // Modal for Portfolio Items
  document.querySelectorAll('.portfolio-item').forEach(item => {
    item.addEventListener('click', function() {
      const modal = document.getElementById('modal');
      const modalTitle = document.getElementById('modal-title');
      const modalImage = document.getElementById('modal-image');
      const modalDescription = document.getElementById('modal-description');
      
      modalTitle.textContent = this.querySelector('.portfolio-text').textContent;
      modalImage.src = this.querySelector('img').dataset.src; // Use dataset.src to get the actual image URL
      modalDescription.textContent = this.getAttribute('aria-label');
      
      modal.style.display = "block";
    });
  });

  // Close Modal
  document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('modal').style.display = "none";
  });

  // Close Modal if clicked outside
  window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('modal')) {
      document.getElementById('modal').style.display = "none";
    }
  });

  // // Real-time form validation for contact form
  // const contactForm = document.getElementById('contact-form');
  // contactForm.addEventListener('input', function(event) {
  //   const target = event.target;
  //   const errorSpan = target.nextElementSibling;
    
  //   if (target.validity.valid) {
  //     errorSpan.textContent = '';
  //     errorSpan.style.display = 'none';
  //   } else {
  //     if (target.id === 'name' && target.validity.valueMissing) {
  //       errorSpan.textContent = 'Please enter your name.';
  //     } else if (target.id === 'email') {
  //       if (target.validity.valueMissing) {
  //         errorSpan.textContent = 'Please enter your email address.';
  //       } else if (target.validity.typeMismatch) {
  //         errorSpan.textContent = 'Please enter a valid email address.';
  //       }
  //     } else if (target.id === 'message' && target.validity.valueMissing) {
  //       errorSpan.textContent = 'Please enter a message.';
  //     }
  //     errorSpan.style.display = 'block';
  //   }
  // });

  // // Contact form submission
  // contactForm.addEventListener('submit', function(event) {
  //   event.preventDefault();
  //   let isValid = true;
    
  //   ['name', 'email', 'message'].forEach(field => {
  //     if (!document.getElementById(field).validity.valid) {
  //       isValid = false;
  //       document.getElementById(field).dispatchEvent(new Event('input'));
  //     }
  //   });

  //   if (isValid) {
  //     alert('Thank you for your message! We will get back to you soon.');
  //     this.reset();
  //   }
  // });

  // Feedback form
  document.getElementById('submit-feedback').addEventListener('click', function() {
    const feedbackMessage = document.getElementById('feedback-message');
    const satisfactionLevel = document.getElementById('satisfaction').value;
    
    feedbackMessage.textContent = `Thank you for your feedback. You rated us ${satisfactionLevel}/5.`;
    feedbackMessage.style.display = 'block';
    feedbackMessage.setAttribute('aria-live', 'assertive');

    setTimeout(() => {
      feedbackMessage.style.display = 'none';
    }, 5000); // Hide message after 5 seconds
  });

  // Load services from JSON
  fetch('services.json')
    .then(response => response.json())
    .then(data => {
      const serviceGrid = document.getElementById('service-grid');
      data.forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card';
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
        // Flip card on click
        card.addEventListener('click', function(e) {
          if (!e.target.closest('.back-to-front')) { // Prevent flip on back button click
            this.querySelector('.card-inner').classList.toggle('is-flipped');
          }
        });
        // Toggle back to front on "Back" button click
        card.querySelector('.back-to-front').addEventListener('click', function(event) {
          event.stopPropagation(); // Prevent the card flip event from firing
          this.closest('.card-inner').classList.remove('is-flipped');
        });
        serviceGrid.appendChild(card);
      });
    });


  // Add theme toggle functionality
 
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;


  function toggleTheme() {
    if (body.classList.contains('light-mode')) {
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
    } else {
      body.classList.remove('dark-mode');
      body.classList.add('light-mode');
    }
  
    // Update icons
    const lightIcon = themeToggle.querySelector('.light-mode-icon');
    const darkIcon = themeToggle.querySelector('.dark-mode-icon');
    lightIcon.classList.toggle('hidden');
    darkIcon.classList.toggle('hidden');
  }


  // Add click event listener to the theme toggle button
  themeToggle.addEventListener('click', toggleTheme);
  // Function to handle background image rotation
  function rotateBackground() {
    const heroBackground = document.getElementById('hero-background');
    const currentImage = parseInt(heroBackground.dataset.currentImage);
    const nextImage = currentImage < 4 ? currentImage + 1 : 1;
    
    // Direct URL setting without lazy loading
    heroBackground.style.backgroundImage = `url('whistler-mountain-hd${nextImage}.jpg')`;
    
    heroBackground.dataset.currentImage = nextImage.toString();
    // Force a repaint to ensure the change is visible immediately
    heroBackground.style.opacity = '0';
    void heroBackground.offsetWidth;  // Trigger reflow
    heroBackground.style.opacity = '1';
  }

  // Add click event listener to the hero section for background rotation
  document.querySelector('.hero').addEventListener('click', function(event) {
    if (!event.target.closest('a, button')) {
      rotateBackground();
    }
  });

  // Initial setup to ensure the first image is set
  document.getElementById('hero-background').style.backgroundImage = "url('whistler-mountain-hd5.jpg')";
  document.getElementById('hero-background').dataset.currentImage = '1';

  // Ensure that the hero background images are not lazy loaded
  const heroImages = document.querySelectorAll('#hero-background');
  heroImages.forEach(img => {
    if (img.dataset.src) {
      img.style.backgroundImage = `url(${img.dataset.src})`;
      delete img.dataset.src; // Remove data-src attribute to prevent lazy loading
    }
  });
});