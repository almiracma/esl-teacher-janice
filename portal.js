// =============================================================
// STUDENT PORTAL — Login, Dashboard, Course Catalog
// =============================================================

// Google Sheets endpoint (handles login via doGet, bookings via doPost)
var SHEETS_URL = 'https://script.google.com/macros/s/AKfycbz-jtuUOVjwxZv1UpsDMCs7E9Nk0A66UlxU9MbQBVClljIwyE98CngcdZob7LyOIrSRPQ/exec';

// Current state
var courseData = null;
var studentData = null; // { student, lessons, stats }
var activeAgeGroup = null;
var activeLevels = {};

// =============================================================
// PASSWORD & LOGIN
// =============================================================
async function hashPassword(password) {
  var encoder = new TextEncoder();
  var data = encoder.encode(password);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

async function checkPassword() {
  var passInput = document.getElementById('portalPassword').value.trim();
  if (!passInput) return;

  var errorEl = document.getElementById('portalError');
  var btn = document.querySelector('.gate-card .btn');

  // Show loading state
  btn.textContent = 'Checking...';
  btn.disabled = true;
  errorEl.style.display = 'none';

  try {
    var hash = await hashPassword(passInput);
    var response = await fetch(SHEETS_URL + '?action=login&hash=' + encodeURIComponent(hash));
    var result = await response.json();

    if (result.status === 'success') {
      sessionStorage.setItem('portal_hash', hash);
      sessionStorage.setItem('portal_data', JSON.stringify(result));
      studentData = result;
      activeAgeGroup = result.student.ageGroup;
      showPortal();
    } else {
      errorEl.textContent = 'Incorrect password. Please try again or contact Teacher Janice.';
      errorEl.style.display = 'block';
      document.getElementById('portalPassword').value = '';
      document.getElementById('portalPassword').focus();
    }
  } catch (err) {
    errorEl.textContent = 'Could not connect. Please check your internet and try again.';
    errorEl.style.display = 'block';
  }

  btn.textContent = 'Access Portal';
  btn.disabled = false;
}

function logout() {
  sessionStorage.removeItem('portal_hash');
  sessionStorage.removeItem('portal_data');
  studentData = null;
  activeAgeGroup = null;
  courseData = null;
  document.getElementById('portalContent').style.display = 'none';
  document.getElementById('portalDashboard').style.display = 'none';
  document.getElementById('passwordGate').style.display = 'flex';
  document.getElementById('portalPassword').value = '';
}

// =============================================================
// PORTAL INIT
// =============================================================
async function showPortal() {
  document.getElementById('passwordGate').style.display = 'none';
  document.getElementById('portalContent').style.display = 'block';

  // Render dashboard
  renderDashboard();

  // Load and render course catalog
  if (!courseData) {
    try {
      var response = await fetch('course-data.json?v=' + Date.now());
      courseData = await response.json();
      document.getElementById('ageGroupTabs').style.display = 'none';

      // Update catalog subtitle
      var group = courseData.ageGroups.find(function(g) { return g.id === activeAgeGroup; });
      if (group) {
        document.getElementById('portalSubtitle').textContent =
          group.label + ' (' + group.ages + ') — Browse topics by level and prepare before class!';
      }
      renderCourses();
    } catch (err) {
      document.getElementById('courseContainer').innerHTML =
        '<div class="coming-soon">Course content could not be loaded. Please try again later.</div>';
    }
  }
}

// Auto-login on page load if session exists
(function() {
  var storedHash = sessionStorage.getItem('portal_hash');
  var storedData = sessionStorage.getItem('portal_data');
  if (storedHash && storedData) {
    try {
      studentData = JSON.parse(storedData);
      activeAgeGroup = studentData.student.ageGroup;
      showPortal();
      // Refresh data in background for latest lesson info
      refreshStudentData(storedHash);
    } catch(e) {
      sessionStorage.removeItem('portal_hash');
      sessionStorage.removeItem('portal_data');
    }
  }

  // Enter key on password input
  var pwInput = document.getElementById('portalPassword');
  if (pwInput) {
    pwInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') checkPassword();
    });
  }
})();

// Silently refresh student data in the background
async function refreshStudentData(hash) {
  try {
    var response = await fetch(SHEETS_URL + '?action=login&hash=' + encodeURIComponent(hash));
    var result = await response.json();
    if (result.status === 'success') {
      studentData = result;
      sessionStorage.setItem('portal_data', JSON.stringify(result));
      renderDashboard();
    }
  } catch(e) {
    // Silently fail — use cached data
  }
}

// =============================================================
// DASHBOARD
// =============================================================
function renderDashboard() {
  var container = document.getElementById('portalDashboard');
  if (!studentData || !container) return;

  var s = studentData.student;
  var stats = studentData.stats;
  var lessons = studentData.lessons;
  var firstName = s.name.split(' ')[0];

  var html = '';

  // Welcome
  html += '<div class="dash-welcome">';
  html += '  <h2>Welcome back, ' + escapeHtml(firstName) + '!</h2>';
  html += '  <p>' + escapeHtml(s.course || 'ESL Course') + '</p>';
  html += '</div>';

  // Stats cards
  html += '<div class="dash-stats">';
  html += '  <div class="dash-stat">';
  html += '    <div class="dash-stat-num">' + stats.total + '</div>';
  html += '    <div class="dash-stat-label">Total Lessons</div>';
  html += '  </div>';
  html += '  <div class="dash-stat dash-stat-teal">';
  html += '    <div class="dash-stat-num">' + stats.completed + '</div>';
  html += '    <div class="dash-stat-label">Completed</div>';
  html += '  </div>';
  html += '  <div class="dash-stat">';
  html += '    <div class="dash-stat-num">' + stats.scheduled + '</div>';
  html += '    <div class="dash-stat-label">Upcoming</div>';
  html += '  </div>';
  html += '  <div class="dash-stat dash-stat-navy">';
  html += '    <div class="dash-stat-num">' + stats.remaining + '</div>';
  html += '    <div class="dash-stat-label">Remaining</div>';
  html += '  </div>';
  html += '</div>';

  // Book a Lesson button (only if student still has remaining lessons)
  if (stats.remaining > 0) {
    html += '<div class="dash-book">';
    html += '  <a href="https://calendly.com/eslteacherjanice/regular-lesson-25mins" target="_blank" rel="noopener" class="dash-book-btn">📅 Book a Lesson</a>';
    html += '  <span class="dash-book-note">You have ' + stats.remaining + ' lesson' + (stats.remaining === 1 ? '' : 's') + ' remaining</span>';
    html += '</div>';
  } else if (stats.total > 0 && stats.remaining <= 0) {
    html += '<div class="dash-book">';
    html += '  <span class="dash-book-note dash-book-done">You\'ve used all your lessons! 🎉 <a href="index.html#pricing">Get more lessons</a></span>';
    html += '</div>';
  }

  // Cancelled/rescheduled note
  if (stats.cancelled > 0 || stats.rescheduled > 0) {
    html += '<div class="dash-note">';
    var parts = [];
    if (stats.cancelled > 0) parts.push(stats.cancelled + ' cancelled');
    if (stats.rescheduled > 0) parts.push(stats.rescheduled + ' rescheduled');
    html += parts.join(' &middot; ');
    html += '</div>';
  }

  // Lesson history
  if (lessons.length > 0) {
    html += '<div class="dash-history">';
    html += '  <h3>Lesson History</h3>';
    html += '  <div class="dash-lessons">';
    lessons.forEach(function(lesson) {
      var statusClass = 'dash-lesson-status';
      var ls = (lesson.status || '').toLowerCase();
      if (ls === 'completed' || ls === 'done') statusClass += ' status-completed';
      else if (ls === 'scheduled' || ls === 'upcoming' || ls === 'confirmed') statusClass += ' status-scheduled';
      else if (ls === 'cancelled' || ls === 'canceled') statusClass += ' status-cancelled';
      else if (ls === 'rescheduled') statusClass += ' status-rescheduled';

      html += '    <div class="dash-lesson">';
      html += '      <div class="dash-lesson-date">';
      html += '        <span class="dash-date">' + escapeHtml(lesson.date) + '</span>';
      html += '        <span class="dash-time">' + escapeHtml(lesson.time) + '</span>';
      html += '      </div>';
      html += '      <div class="dash-lesson-info">' + escapeHtml(lesson.course || 'Lesson');
      if (lesson.lessonNum) html += ' <span class="dash-lesson-num">#' + escapeHtml(lesson.lessonNum.toString()) + '</span>';
      html += '      </div>';
      html += '      <div class="' + statusClass + '">' + escapeHtml(lesson.status || '') + '</div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';
  } else {
    html += '<div class="dash-empty">';
    html += '  No lessons booked yet. <a href="https://calendly.com/eslteacherjanice/regular-lesson-25mins" target="_blank" rel="noopener">Book your first lesson!</a>';
    html += '</div>';
  }

  container.innerHTML = html;
  container.style.display = 'block';
}

// =============================================================
// RENDER COURSES
// =============================================================
function renderCourses() {
  var container = document.getElementById('courseContainer');
  container.innerHTML = '';

  var group = courseData.ageGroups.find(function(g) { return g.id === activeAgeGroup; });
  if (!group) return;

  group.courses.forEach(function(course) {
    var card = document.createElement('div');
    card.className = 'course-card';

    if (!activeLevels[course.id]) {
      activeLevels[course.id] = course.levels[0].id;
    }

    // Header
    var header = document.createElement('div');
    header.className = 'course-card-header';

    var title = document.createElement('h3');
    title.innerHTML = '<span class="course-icon">' + group.icon + '</span>' + course.title;
    header.appendChild(title);

    // Level tabs
    var levelTabs = document.createElement('div');
    levelTabs.className = 'level-tabs';

    course.levels.forEach(function(level) {
      var tab = document.createElement('button');
      tab.className = 'level-tab' + (level.id === activeLevels[course.id] ? ' active' : '');
      tab.textContent = level.label;
      tab.onclick = function() { switchLevel(course.id, level.id); };
      levelTabs.appendChild(tab);
    });

    header.appendChild(levelTabs);
    card.appendChild(header);

    // Topic list
    var topicList = document.createElement('div');
    topicList.className = 'topic-list';
    topicList.id = 'topics-' + course.id;

    var activeLevel = course.levels.find(function(l) { return l.id === activeLevels[course.id]; });
    if (activeLevel && activeLevel.topics.length > 0) {
      topicList.innerHTML = renderTopics(activeLevel.topics);
    } else {
      topicList.innerHTML = '<div class="coming-soon">Topics coming soon! Check back later.</div>';
    }

    card.appendChild(topicList);
    container.appendChild(card);
  });
}

function switchLevel(courseId, levelId) {
  activeLevels[courseId] = levelId;
  renderCourses();
}

function renderTopics(topics) {
  var html = '';
  topics.forEach(function(topic, index) {
    html += '<div class="topic-item">';
    html += '  <div class="topic-number">' + (index + 1) + '</div>';
    html += '  <div class="topic-info">';
    html += '    <h4>' + escapeHtml(topic.title) + '</h4>';
    html += '    <p>' + escapeHtml(topic.description) + '</p>';

    if (topic.materials && topic.materials.length > 0) {
      html += '    <div class="topic-downloads">';
      topic.materials.forEach(function(mat) {
        html += '      <a href="' + escapeHtml(mat.file) + '" download class="download-btn">' + escapeHtml(mat.label) + '</a>';
      });
      html += '    </div>';
    }

    html += '  </div>';
    html += '</div>';
  });
  return html;
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =============================================================
// CONTENT PROTECTION
// =============================================================
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });

document.addEventListener('keydown', function(e) {
  var blocked = ['c', 'u', 's', 'p'];
  if ((e.ctrlKey || e.metaKey) && blocked.indexOf(e.key.toLowerCase()) >= 0) {
    e.preventDefault();
  }
  if (e.key === 'F12') { e.preventDefault(); }
});

document.addEventListener('dragstart', function(e) { e.preventDefault(); });
