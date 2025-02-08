document.addEventListener('DOMContentLoaded', () => {
  // Remove loader once the page is loaded
  setTimeout(() => {
      document.getElementById('loader').style.display = 'none';
  }, 1000); // Simulate loading time

  // Lazy Loading Images
  var lazyImages = [].slice.call(document.querySelectorAll("img[data-src]"));

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
          const elementVisible = 150; // Element is considered visible when within 150px from the bottom of the viewport

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
          modalImage.src = this.querySelector('img').src;
          modalDescription.textContent = this.getAttribute('aria-label'); // Use aria-label as description
          
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

  // Real-time form validation for contact form
  const contactForm = document.getElementById('contact-form');
  contactForm.addEventListener('input', function(event) {
      const target = event.target;
      const errorSpan = target.nextElementSibling;
      
      if (target.validity.valid) {
          errorSpan.textContent = ''; // Clear error message
          errorSpan.style.display = 'none';
      } else {
          if (target.id === 'name' && target.validity.valueMissing) {
              errorSpan.textContent = 'Please enter your name.';
          } else if (target.id === 'email') {
              if (target.validity.valueMissing) {
                  errorSpan.textContent = 'Please enter your email address.';
              } else if (target.validity.typeMismatch) {
                  errorSpan.textContent = 'Please enter a valid email address.';
              }
          } else if (target.id === 'message' && target.validity.valueMissing) {
              errorSpan.textContent = 'Please enter a message.';
          }
          errorSpan.style.display = 'block';
      }
  });

  // Placeholder for contact form submission with better accessibility
  contactForm.addEventListener('submit', function(event) {
      event.preventDefault();
      let isValid = true;
      
      // Check if all fields are valid before submission
      ['name', 'email', 'message'].forEach(field => {
          if (!document.getElementById(field).validity.valid) {
              isValid = false;
              // Show error for each invalid field
              document.getElementById(field).dispatchEvent(new Event('input'));
          }
      });

      if (isValid) {
          alert('Thank you for your message! We will get back to you soon.');
          this.reset();
      }
  });

  // Feedback form
  document.getElementById('submit-feedback').addEventListener('click', function() {
      const feedbackMessage = document.getElementById('feedback-message');
      const satisfactionLevel = document.getElementById('satisfaction').value;
      
      feedbackMessage.textContent = `Thank you for your feedback. You rated us ${satisfactionLevel}/5.`;
      feedbackMessage.style.display = 'block';
      feedbackMessage.setAttribute('aria-live', 'assertive'); // For screen readers to announce change immediately

      // Here you would typically send this data to a server or log it
      // For this example, we're just showing a message
      setTimeout(() => {
          feedbackMessage.style.display = 'none';
      }, 5000); // Hide message after 5 seconds
  });

  // Accessibility: Focus management when navigating sections
  document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', function(e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          target.focus();
          window.scrollTo({
              top: target.offsetTop,
              behavior: 'smooth'
          });
      });
  });
});