// ============================================================
// TEACHER JANICE: Paste your Google Sheets URL below.
// (See SETUP-GUIDE.txt for how to get this URL)
// Leave it blank ('') until you've set up Google Sheets.
// ============================================================
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz-jtuUOVjwxZv1UpsDMCs7E9Nk0A66UlxU9MbQBVClljIwyE98CngcdZob7LyOIrSRPQ/exec';
// ============================================================

// Helper: Send form data to Google Sheets
function sendToGoogleSheets(data) {
  if (!GOOGLE_SHEETS_URL) return Promise.resolve();
  return fetch(GOOGLE_SHEETS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(function(err) {
    console.log('Google Sheets save (non-blocking):', err);
  });
}

// ===== Mobile Navigation =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  navLinks.classList.toggle('active');
});

// Close mobile menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navLinks.classList.remove('active');
  });
});

// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== Scroll Reveal Animation =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all animatable elements
document.querySelectorAll('.service-card, .pricing-card, .testimonial-card, .highlight-card, .info-card, .step-card, .cta-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// Add revealed styles
const style = document.createElement('style');
style.textContent = '.revealed { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(style);

// Stagger animation for grid items
document.querySelectorAll('.services-grid, .pricing-grid, .testimonials-grid, .about-highlights, .steps-grid').forEach(grid => {
  const children = grid.children;
  Array.from(children).forEach((child, index) => {
    child.style.transitionDelay = `${index * 0.1}s`;
  });
});

// ===== Course Dropdown — Pricing Cards =====
document.querySelectorAll('.course-select').forEach(function(select) {
  var prices = JSON.parse(select.getAttribute('data-prices'));
  var card = select.closest('.pricing-body');

  select.addEventListener('change', function() {
    var course = prices[this.value];
    // Update price display
    card.querySelector('.price-amount').textContent = '$' + course.price;
    // Update package deal
    card.querySelector('.pkg-price').textContent = '$' + course.pkg;
    // Update pay 1 lesson form
    var pay1Form = card.querySelector('.pay1-form');
    pay1Form.querySelector('[name="amount"]').value = course.price + '.00';
    pay1Form.querySelector('[name="item_name"]').value = course.item1;
    pay1Form.querySelector('button').textContent = 'Pay 1 Lesson \u2014 $' + course.price;
    // Update pay 10 lessons form
    var pay10Form = card.querySelector('.pay10-form');
    pay10Form.querySelector('[name="amount"]').value = course.pkg + '.00';
    pay10Form.querySelector('[name="item_name"]').value = course.item10;
    pay10Form.querySelector('button').innerHTML = 'Pay 10 Lessons \u2014 <s>$' + course.orig + '</s> $' + course.pkg;
  });
});

// ===== Contact Form Handling =====
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // Gather data for Google Sheets
    const sheetsData = {
      formType: 'Inquiry',
      name: form.querySelector('[name="name"]').value,
      email: form.querySelector('[name="email"]').value,
      message: form.querySelector('[name="message"]').value
    };

    // Send to Google Sheets, then submit to FormSubmit for email
    sendToGoogleSheets(sheetsData).then(function() {
      form.submit();
    });
  });
}
