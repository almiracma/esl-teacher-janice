// =============================================================
// GOOGLE APPS SCRIPT — Paste this into your Google Sheet
// (See SETUP-GUIDE.txt for step-by-step instructions)
// =============================================================

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
    // Style the header row
    var headerRange = sheet.getRange(1, 1, 1, 9);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1A2744');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    // Set column widths
    sheet.setColumnWidth(1, 120);  // Date
    sheet.setColumnWidth(2, 100);  // Time
    sheet.setColumnWidth(3, 140);  // Student Name
    sheet.setColumnWidth(4, 160);  // Course
    sheet.setColumnWidth(5, 80);   // Lesson #
    sheet.setColumnWidth(6, 80);   // Duration
    sheet.setColumnWidth(7, 100);  // Status
    sheet.setColumnWidth(8, 120);  // Platform
    sheet.setColumnWidth(9, 200);  // Notes
    // Freeze header row
    sheet.setFrozenRows(1);
  }

  // Parse the lesson datetime
  var lessonDate = data.startTime ? new Date(data.startTime) : '';
  var courseName = data.eventType || '';
  // Trial lessons are 15 min, regular lessons are 25 min
  var duration = courseName.toLowerCase().indexOf('trial') >= 0 ? '15 min' : '25 min';

  // Append the booking (matches: Date | Time | Student Name | Course | Lesson # | Duration | Status | Platform | Notes)
  sheet.appendRow([
    lessonDate,           // A: Date (formatted below)
    lessonDate,           // B: Time (same date object, formatted to time only)
    data.name || '',      // C: Student Name
    courseName,           // D: Course
    '',                   // E: Lesson # (fill in manually)
    duration,             // F: Duration
    'Scheduled',          // G: Status
    '',                   // H: Platform (fill in manually)
    ''                    // I: Notes
  ]);

  var lastRow = sheet.getLastRow();

  // Format date column (date only) and time column (time only)
  sheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(lastRow, 2).setNumberFormat('h:mm AM/PM');

  // Style "Scheduled" status in teal (column G = 7)
  var statusCell = sheet.getRange(lastRow, 7);
  statusCell.setFontColor('#2A9D8F');
  statusCell.setFontWeight('bold');

  // Highlight new row with light yellow
  sheet.getRange(lastRow, 1, 1, 9).setBackground('#FFF9E6');

  // Mark the Bookings tab RED so you can see new data at a glance
  sheet.setTabColor('#FF4444');
}

// =============================================================
// INQUIRIES — From the website contact form
// =============================================================
function handleInquiry(ss, data) {
  var sheetName = 'Inquiries';
  var sheet = ss.getSheetByName(sheetName);

  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow([
      'Date', 'Name', 'Email', 'Message', 'Status', 'Follow-up Date', 'Notes'
    ]);
    // Style the header row
    var headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1A2744');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    // Set column widths
    sheet.setColumnWidth(1, 100); // Date
    sheet.setColumnWidth(2, 140); // Name
    sheet.setColumnWidth(3, 220); // Email
    sheet.setColumnWidth(4, 300); // Message
    sheet.setColumnWidth(5, 100); // Status
    sheet.setColumnWidth(6, 120); // Follow-up Date
    sheet.setColumnWidth(7, 200); // Notes
    // Freeze header row
    sheet.setFrozenRows(1);
  }

  // Append the inquiry
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.message || '',
    'New',
    '',
    ''
  ]);

  // Format the new row's date column
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd');

  // Highlight "New" status in teal
  var statusCell = sheet.getRange(lastRow, 5);
  statusCell.setFontColor('#2A9D8F');
  statusCell.setFontWeight('bold');

  // Highlight the entire new row with a light yellow background
  sheet.getRange(lastRow, 1, 1, 7).setBackground('#FFF9E6');

  // Mark the Inquiries tab RED so you can see new data at a glance
  sheet.setTabColor('#FF4444');
}

// =============================================================
// Run this manually to clear the red tab markers after you've
// reviewed new bookings/inquiries. Go to: Run > clearNewMarker
// =============================================================
function clearNewMarker() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Clear Inquiries markers
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

  // Clear Bookings markers
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
