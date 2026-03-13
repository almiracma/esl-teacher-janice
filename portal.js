// =============================================================
// STUDENT PORTAL — Password, Course Rendering & Protection
// =============================================================

// SHA-256 hash of the portal password (ESLJanice2026)
// To change: generate a new hash at https://emn178.github.io/online-tools/sha256.html
var CORRECT_HASH = 'b6fde9c17cdb21dafef569e31e3b6c9e00e074c440410871b0a8d693184c9499';

// Current state
var courseData = null;
var activeAgeGroup = 'kids';
var activeLevels = {}; // { courseId: levelId }

// =============================================================
// PASSWORD
// =============================================================
async function hashPassword(password) {
  var encoder = new TextEncoder();
  var data = encoder.encode(password);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

async function checkPassword() {
  var input = document.getElementById('portalPassword').value.trim();
  if (!input) return;

  var hash = await hashPassword(input);
  if (hash === CORRECT_HASH) {
    sessionStorage.setItem('portal_auth', hash);
    document.getElementById('portalError').style.display = 'none';
    showPortal();
  } else {
    var errorEl = document.getElementById('portalError');
    errorEl.textContent = 'Incorrect password. Please try again or contact Teacher Janice.';
    errorEl.style.display = 'block';
    document.getElementById('portalPassword').value = '';
    document.getElementById('portalPassword').focus();
  }
}

function logout() {
  sessionStorage.removeItem('portal_auth');
  document.getElementById('portalContent').style.display = 'none';
  document.getElementById('passwordGate').style.display = 'flex';
  document.getElementById('portalPassword').value = '';
}

// =============================================================
// PORTAL INIT
// =============================================================
async function showPortal() {
  document.getElementById('passwordGate').style.display = 'none';
  document.getElementById('portalContent').style.display = 'block';

  if (!courseData) {
    try {
      var response = await fetch('course-data.json?v=' + Date.now());
      courseData = await response.json();
      renderAgeGroupTabs();
      switchAgeGroup('kids');
    } catch (err) {
      document.getElementById('courseContainer').innerHTML =
        '<div class="coming-soon">Course content could not be loaded. Please try again later or contact Teacher Janice.</div>';
    }
  }
}

// Check if already authenticated on page load
(function() {
  var stored = sessionStorage.getItem('portal_auth');
  if (stored === CORRECT_HASH) {
    showPortal();
  }

  // Enter key on password input
  var pwInput = document.getElementById('portalPassword');
  if (pwInput) {
    pwInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        checkPassword();
      }
    });
  }
})();

// =============================================================
// RENDER COURSES
// =============================================================
function renderAgeGroupTabs() {
  var tabsContainer = document.getElementById('ageGroupTabs');
  tabsContainer.innerHTML = '';

  courseData.ageGroups.forEach(function(group) {
    var btn = document.createElement('button');
    btn.className = 'age-tab' + (group.id === activeAgeGroup ? ' active' : '');
    btn.textContent = group.label + ' (' + group.ages + ')';
    btn.onclick = function() { switchAgeGroup(group.id); };
    tabsContainer.appendChild(btn);
  });
}

function switchAgeGroup(groupId) {
  activeAgeGroup = groupId;

  // Update tab styles
  document.querySelectorAll('.age-tab').forEach(function(tab, i) {
    tab.className = 'age-tab' + (courseData.ageGroups[i].id === groupId ? ' active' : '');
  });

  renderCourses();
}

function renderCourses() {
  var container = document.getElementById('courseContainer');
  container.innerHTML = '';

  var group = courseData.ageGroups.find(function(g) { return g.id === activeAgeGroup; });
  if (!group) return;

  group.courses.forEach(function(course) {
    var card = document.createElement('div');
    card.className = 'course-card';

    // Default to first level if not set
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

// Disable right-click
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// Disable keyboard shortcuts for copying, viewing source, saving, printing
document.addEventListener('keydown', function(e) {
  var blocked = ['c', 'u', 's', 'p'];
  if ((e.ctrlKey || e.metaKey) && blocked.indexOf(e.key.toLowerCase()) >= 0) {
    e.preventDefault();
  }
  if (e.key === 'F12') {
    e.preventDefault();
  }
});

// Disable drag
document.addEventListener('dragstart', function(e) {
  e.preventDefault();
});
