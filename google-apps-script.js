// =============================================================
// GOOGLE APPS SCRIPT — Paste this into your Google Sheet
// (See PORTAL-GUIDE.txt for instructions)
// =============================================================

// --- GET: Student Portal Login & Dashboard Data ---
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e.parameter.action || '').toLowerCase();

    if (action === 'login') {
      return handleLogin(ss, e.parameter.hash || '');
    }

    return jsonResponse({ status: 'error', message: 'Unknown action' });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

// --- POST: Bookings, Inquiries ---
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);

    if (data.formType === 'Booking') {
      handleBooking(ss, data);
    } else {
      handleInquiry(ss, data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================================
// STUDENT LOGIN — Checks password against the Students sheet
// Students sheet: Name | Password | Age Group | Total Lessons | Course | Status
// =============================================================
function handleLogin(ss, clientHash) {
  var studentsSheet = ss.getSheetByName('Students');
  if (!studentsSheet || studentsSheet.getLastRow() < 2) {
    return jsonResponse({ status: 'error', message: 'No students registered yet' });
  }

  var data = studentsSheet.getDataRange().getValues();
  var student = null;

  // Check each student's password (skip header row)
  for (var i = 1; i < data.length; i++) {
    var name = (data[i][0] || '').toString().trim();
    var password = (data[i][1] || '').toString().trim();
    var ageGroup = (data[i][2] || '').toString().trim();
    var totalLessons = parseInt(data[i][3]) || 0;
    var course = (data[i][4] || '').toString().trim();
    var status = (data[i][5] || 'Active').toString().trim();

    if (!password || !name) continue;
    if (status.toLowerCase() === 'inactive') continue;

    // Hash the stored password and compare with what the student sent
    var serverHash = sha256(password);
    if (serverHash === clientHash) {
      student = {
        name: name,
        ageGroup: ageGroup.toLowerCase(),
        totalLessons: totalLessons,
        course: course
      };
      break;
    }
  }

  if (!student) {
    return jsonResponse({ status: 'error', message: 'Invalid password' });
  }

  // Get lesson history from Bookings sheet
  var bookingsSheet = ss.getSheetByName('Bookings');
  var lessons = [];
  var stats = { completed: 0, scheduled: 0, cancelled: 0, rescheduled: 0 };

  if (bookingsSheet && bookingsSheet.getLastRow() >= 2) {
    var bookings = bookingsSheet.getDataRange().getValues();
    // Columns: Date | Time | Student Name | Course | Lesson # | Duration | Status | Platform | Notes
    for (var i = 1; i < bookings.length; i++) {
      var bookingName = (bookings[i][2] || '').toString().trim();
      if (bookingName.toLowerCase() === student.name.toLowerCase()) {
        var lessonDate = bookings[i][0];
        var lessonTime = bookings[i][1];
        var courseName = (bookings[i][3] || '').toString();
        var lessonNum = (bookings[i][4] || '').toString();
        var lessonStatus = (bookings[i][6] || '').toString();

        var dateStr = '';
        var timeStr = '';
        try {
          if (lessonDate) dateStr = Utilities.formatDate(new Date(lessonDate), Session.getScriptTimeZone(), 'MMM d, yyyy');
          if (lessonTime) timeStr = Utilities.formatDate(new Date(lessonTime), Session.getScriptTimeZone(), 'h:mm a');
        } catch(err) {}

        lessons.push({
          date: dateStr,
          time: timeStr,
          course: courseName,
          lessonNum: lessonNum,
          status: lessonStatus
        });

        // Count by status
        var s = lessonStatus.toLowerCase();
        if (s === 'completed' || s === 'done') stats.completed++;
        else if (s === 'scheduled' || s === 'upcoming' || s === 'confirmed') stats.scheduled++;
        else if (s === 'cancelled' || s === 'canceled') stats.cancelled++;
        else if (s === 'rescheduled') stats.rescheduled++;
      }
    }
  }

  // Sort lessons by date (newest first)
  lessons.sort(function(a, b) {
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  var remaining = Math.max(0, student.totalLessons - stats.completed);

  return jsonResponse({
    status: 'success',
    student: student,
    lessons: lessons,
    stats: {
      total: student.totalLessons,
      completed: stats.completed,
      scheduled: stats.scheduled,
      cancelled: stats.cancelled,
      rescheduled: stats.rescheduled,
      remaining: remaining
    }
  });
}

// SHA-256 hash (matches the client-side crypto.subtle.digest)
function sha256(input) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input.toString(), Utilities.Charset.UTF_8);
  return digest.map(function(b) {
    return ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2);
  }).join('');
}

// Helper: return JSON response
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============================================================
// BOOKINGS — Auto-logged from Calendly via thank-you pages
// Matches existing sheet: Date | Time | Student Name | Course |
//   Lesson # | Duration | Status | Platform | Notes
// =============================================================
function handleBooking(ss, data) {
  var sheetName = 'Bookings';
  var sheet = ss.getSheetByName(sheetName);

  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow([
      'Date', 'Time', 'Student Name', 'Course',
      'Lesson #', 'Duration', 'Status', 'Platform', 'Notes'
    ]);
    var headerRange = sheet.getRange(1, 1, 1, 9);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1A2744');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    sheet.setColumnWidth(1, 120);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 140);
    sheet.setColumnWidth(4, 160);
    sheet.setColumnWidth(5, 80);
    sheet.setColumnWidth(6, 80);
    sheet.setColumnWidth(7, 100);
    sheet.setColumnWidth(8, 120);
    sheet.setColumnWidth(9, 200);
    sheet.setFrozenRows(1);
  }

  var lessonDate = data.startTime ? new Date(data.startTime) : '';
  var courseName = data.eventType || '';
  var duration = courseName.toLowerCase().indexOf('trial') >= 0 ? '15 min' : '25 min';

  sheet.appendRow([
    lessonDate, lessonDate, data.name || '', courseName,
    '', duration, 'Scheduled', '', ''
  ]);

  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(lastRow, 2).setNumberFormat('h:mm AM/PM');

  var statusCell = sheet.getRange(lastRow, 7);
  statusCell.setFontColor('#2A9D8F');
  statusCell.setFontWeight('bold');
  sheet.getRange(lastRow, 1, 1, 9).setBackground('#FFF9E6');
  sheet.setTabColor('#FF4444');
}

// =============================================================
// INQUIRIES — From the website contact form
// =============================================================
function handleInquiry(ss, data) {
  var sheetName = 'Inquiries';
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow([
      'Date', 'Name', 'Email', 'Message', 'Status', 'Follow-up Date', 'Notes'
    ]);
    var headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1A2744');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    sheet.setColumnWidth(1, 100);
    sheet.setColumnWidth(2, 140);
    sheet.setColumnWidth(3, 220);
    sheet.setColumnWidth(4, 300);
    sheet.setColumnWidth(5, 100);
    sheet.setColumnWidth(6, 120);
    sheet.setColumnWidth(7, 200);
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    new Date(), data.name || '', data.email || '',
    data.message || '', 'New', '', ''
  ]);

  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd');
  var statusCell = sheet.getRange(lastRow, 5);
  statusCell.setFontColor('#2A9D8F');
  statusCell.setFontWeight('bold');
  sheet.getRange(lastRow, 1, 1, 7).setBackground('#FFF9E6');
  sheet.setTabColor('#FF4444');
}

// =============================================================
// Run this manually to clear the red tab markers after you've
// reviewed new bookings/inquiries. Go to: Run > clearNewMarker
// =============================================================
function clearNewMarker() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var inquiries = ss.getSheetByName('Inquiries');
  if (inquiries) {
    inquiries.setTabColor('#1A2744');
    var lastRow = inquiries.getLastRow();
    for (var i = 2; i <= lastRow; i++) {
      var status = inquiries.getRange(i, 5).getValue();
      if (status !== 'New') {
        inquiries.getRange(i, 1, 1, 7).setBackground(null);
      }
    }
  }

  var bookings = ss.getSheetByName('Bookings');
  if (bookings) {
    bookings.setTabColor('#1A2744');
    var lastRow = bookings.getLastRow();
    for (var i = 2; i <= lastRow; i++) {
      var bg = bookings.getRange(i, 1).getBackground();
      if (bg === '#fff9e6') {
        bookings.getRange(i, 1, 1, 9).setBackground(null);
      }
    }
  }
}
