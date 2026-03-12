// ============================================================
// TEACHER JANICE: Paste your Google Sheets URL below.
// (See SETUP-GUIDE.txt for how to get this URL)
// Leave it blank ('') until you've set up Google Sheets.
// ============================================================
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxDCVPqW1uXVsYBMwO8FaAIOYdmiXX2rwc0LBsjT_Zd5WVOSu8zLTTvPrOglNYBwnCvlw/exec';
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

// Helper: Collect checked lesson-focus values from a form
function getCheckedFocus(form) {
  var boxes = form.querySelectorAll('input[name="focus"]:checked');
  return Array.from(boxes).map(function(cb) { return cb.value; }).join(', ');
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
document.querySelectorAll('.service-card, .pricing-card, .testimonial-card, .highlight-card, .info-card').forEach(el => {
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
document.querySelectorAll('.services-grid, .pricing-grid, .testimonials-grid, .about-highlights').forEach(grid => {
  const children = grid.children;
  Array.from(children).forEach((child, index) => {
    child.style.transitionDelay = `${index * 0.1}s`;
  });
});

// ===== Weekly Schedule & Booking =====
(function() {
  const scheduleGrid = document.getElementById('scheduleGrid');
  const scheduleWeek = document.getElementById('scheduleWeek');
  const timezoneDisplay = document.getElementById('timezoneDisplay');
  const bookingModal = document.getElementById('bookingModal');
  const modalClose = document.getElementById('modalClose');
  const modalSlotInfo = document.getElementById('modalSlotInfo');
  const bookingSlot = document.getElementById('bookingSlot');
  const bookingForm = document.getElementById('bookingForm');

  // Show user's timezone
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  timezoneDisplay.textContent = 'Your timezone: ' + tz;

  // ============================================================
  // TEACHER JANICE: Edit this section every Monday to update your
  // weekly schedule. Set the weekStartDate to the Monday of the
  // current week, then list your available times for each day.
  //
  // Format: 'HH:MM' in Philippine Time (Asia/Manila, UTC+8)
  // The website will automatically convert to each student's
  // local timezone.
  //
  // To mark a slot as booked, move it from 'available' to 'booked'.
  // ============================================================

  const weekStartDate = '2026-03-09'; // Monday date (YYYY-MM-DD)

  const weeklySlots = {
    mon: {
      available: ['09:00', '10:00', '11:00', '14:00', '15:00', '19:00', '20:00'],
      booked:    ['13:00']
    },
    tue: {
      available: ['09:00', '10:00', '14:00', '15:00', '16:00', '20:00'],
      booked:    ['11:00', '19:00']
    },
    wed: {
      available: ['09:00', '10:00', '11:00', '14:00', '15:00', '19:00'],
      booked:    []
    },
    thu: {
      available: ['09:00', '10:00', '14:00', '15:00', '19:00', '20:00'],
      booked:    ['11:00']
    },
    fri: {
      available: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      booked:    ['19:00', '20:00']
    },
    sat: {
      available: ['09:00', '10:00', '11:00'],
      booked:    []
    },
    sun: {
      available: [],
      booked:    []
    }
  };

  // ============================================================
  // END OF EDITABLE SECTION
  // ============================================================

  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Parse the week start date
  const startParts = weekStartDate.split('-');
  const weekStart = new Date(startParts[0], startParts[1] - 1, startParts[2]);

  // Update week label
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  scheduleWeek.textContent = 'Week of ' +
    monthNames[weekStart.getMonth()] + ' ' + weekStart.getDate() + ' - ' +
    (weekStart.getMonth() !== weekEnd.getMonth() ? monthNames[weekEnd.getMonth()] + ' ' : '') +
    weekEnd.getDate() + ', ' + weekEnd.getFullYear();

  // Convert Philippine Time (UTC+8) to local time
  function phtToLocal(dateStr, timeStr) {
    // Create date in PHT (UTC+8)
    const [h, m] = timeStr.split(':').map(Number);
    const [y, mo, d] = dateStr.split('-').map(Number);
    // PHT is UTC+8, so subtract 8 hours to get UTC
    const utc = new Date(Date.UTC(y, mo - 1, d, h - 8, m));
    return utc;
  }

  function formatLocalTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function formatLocalDate(date) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Build the schedule grid
  dayKeys.forEach((key, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + i);
    const dateStr = dayDate.getFullYear() + '-' +
      String(dayDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(dayDate.getDate()).padStart(2, '0');

    const dayEl = document.createElement('div');
    dayEl.className = 'schedule-day';

    const headerEl = document.createElement('div');
    headerEl.className = 'day-header';
    headerEl.innerHTML = '<div class="day-name">' + dayNames[i] + '</div><div class="day-date">' +
      monthNames[dayDate.getMonth()] + ' ' + dayDate.getDate() + '</div>';
    dayEl.appendChild(headerEl);

    const slotsEl = document.createElement('div');
    slotsEl.className = 'day-slots';

    const data = weeklySlots[key];
    const allSlots = [
      ...data.available.map(t => ({ time: t, status: 'available' })),
      ...data.booked.map(t => ({ time: t, status: 'booked' }))
    ].sort((a, b) => a.time.localeCompare(b.time));

    if (allSlots.length === 0) {
      const noSlot = document.createElement('div');
      noSlot.className = 'no-slots';
      noSlot.textContent = 'No slots';
      slotsEl.appendChild(noSlot);
    } else {
      allSlots.forEach(slot => {
        const localDate = phtToLocal(dateStr, slot.time);
        const slotEl = document.createElement('div');
        slotEl.className = 'time-slot ' + slot.status;
        slotEl.textContent = formatLocalTime(localDate);

        if (slot.status === 'available') {
          slotEl.addEventListener('click', () => {
            const info = dayNames[i] + ', ' + formatLocalDate(localDate) + ' at ' + formatLocalTime(localDate);
            modalSlotInfo.textContent = info;
            bookingSlot.value = info + ' (PHT: ' + slot.time + ')';
            bookingModal.classList.add('active');
          });
        }

        slotsEl.appendChild(slotEl);
      });
    }

    dayEl.appendChild(slotsEl);
    scheduleGrid.appendChild(dayEl);
  });

  // Modal controls
  modalClose.addEventListener('click', () => {
    bookingModal.classList.remove('active');
  });

  bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) {
      bookingModal.classList.remove('active');
    }
  });

  bookingForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const form = this;
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Booking...';
    btn.disabled = true;

    // Gather data for Google Sheets
    const sheetsData = {
      formType: 'Booking',
      name: form.querySelector('[name="name"]').value,
      email: form.querySelector('[name="email"]').value,
      country: form.querySelector('[name="country"]').value,
      timezone: form.querySelector('[name="timezone"]').value,
      course: form.querySelector('[name="course"]').value,
      slot: form.querySelector('[name="slot"]').value,
      focus: getCheckedFocus(form)
    };

    // Send to Google Sheets, then submit to FormSubmit for email
    sendToGoogleSheets(sheetsData).then(function() {
      form.submit();
    });
  });
})();

// ===== Auto-fill Timezone Fields =====
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const bookingTimezoneField = document.getElementById('bookingTimezone');
if (bookingTimezoneField) {
  bookingTimezoneField.value = userTimezone;
}

// ===== Timezone Autocomplete Dropdown =====
(function() {
  const tzData = [
    { value: 'Asia/Manila', label: 'Philippines', utc: 'UTC+8' },
    { value: 'Asia/Tokyo', label: 'Japan', utc: 'UTC+9' },
    { value: 'Asia/Seoul', label: 'South Korea', utc: 'UTC+9' },
    { value: 'Asia/Shanghai', label: 'China', utc: 'UTC+8' },
    { value: 'Asia/Taipei', label: 'Taiwan', utc: 'UTC+8' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Vietnam', utc: 'UTC+7' },
    { value: 'Asia/Bangkok', label: 'Thailand', utc: 'UTC+7' },
    { value: 'Asia/Jakarta', label: 'Indonesia', utc: 'UTC+7' },
    { value: 'Asia/Kolkata', label: 'India', utc: 'UTC+5:30' },
    { value: 'Asia/Riyadh', label: 'Saudi Arabia', utc: 'UTC+3' },
    { value: 'Asia/Dubai', label: 'UAE', utc: 'UTC+4' },
    { value: 'Europe/Istanbul', label: 'Turkey', utc: 'UTC+3' },
    { value: 'Europe/Moscow', label: 'Russia - Moscow', utc: 'UTC+3' },
    { value: 'America/Sao_Paulo', label: 'Brazil', utc: 'UTC-3' },
    { value: 'America/Bogota', label: 'Colombia', utc: 'UTC-5' },
    { value: 'America/Mexico_City', label: 'Mexico', utc: 'UTC-6' },
    { value: 'America/New_York', label: 'US - Eastern', utc: 'UTC-5' },
    { value: 'America/Chicago', label: 'US - Central', utc: 'UTC-6' },
    { value: 'America/Los_Angeles', label: 'US - Pacific', utc: 'UTC-8' },
    { value: 'Europe/London', label: 'UK', utc: 'UTC+0' },
    { value: 'Europe/Paris', label: 'Europe - Central', utc: 'UTC+1' },
    { value: 'Australia/Sydney', label: 'Australia - Sydney', utc: 'UTC+11' }
  ];

  const input = document.getElementById('timezone');
  const dropdown = document.getElementById('tzDropdown');
  if (!input || !dropdown) return;

  // Auto-fill with detected timezone
  input.value = userTimezone;

  function renderOptions(filter) {
    var query = (filter || '').toLowerCase();
    var html = '';
    tzData.forEach(function(tz) {
      var match = tz.value.toLowerCase().indexOf(query) !== -1 ||
                  tz.label.toLowerCase().indexOf(query) !== -1 ||
                  tz.utc.toLowerCase().indexOf(query) !== -1;
      if (!filter || match) {
        html += '<div class="tz-option" data-value="' + tz.value + '">' +
                '<span class="tz-label">' + tz.label + '</span>' +
                '<span class="tz-utc">(' + tz.utc + ')</span>' +
                '</div>';
      }
    });
    dropdown.innerHTML = html || '<div class="tz-option" style="color:var(--gray-400)">No matches</div>';
  }

  function openDropdown() {
    renderOptions(input.value === userTimezone ? '' : input.value);
    dropdown.classList.add('open');
  }

  function closeDropdown() {
    dropdown.classList.remove('open');
  }

  input.addEventListener('focus', openDropdown);
  input.addEventListener('input', function() {
    renderOptions(this.value);
    dropdown.classList.add('open');
  });

  dropdown.addEventListener('click', function(e) {
    var option = e.target.closest('.tz-option');
    if (option && option.dataset.value) {
      input.value = option.dataset.value;
      closeDropdown();
    }
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.tz-wrapper')) {
      closeDropdown();
    }
  });
})();

// ===== Contact Form Handling =====
const contactForm = document.getElementById('contactForm');

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
    country: form.querySelector('[name="country"]').value,
    timezone: form.querySelector('[name="timezone"]').value,
    course: form.querySelector('[name="course"]').value,
    level: form.querySelector('[name="level"]').value,
    focus: getCheckedFocus(form),
    message: form.querySelector('[name="message"]').value
  };

  // Send to Google Sheets, then submit to FormSubmit for email
  sendToGoogleSheets(sheetsData).then(function() {
    form.submit();
  });
});
