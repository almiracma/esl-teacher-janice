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
// =============================================================
function handleBooking(ss, data) {
  var sheetName = 'Bookings';
  var sheet = ss.getSheetByName(sheetName);

  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow([
      'Lesson Date & Time', 'Student Name', 'Email', 'Course',
      'Duration', 'Status', 'Platform',
      'Cancelled Date & Time', 'Cancel Notice', 'Notes'
    ]);
    // Style the header row
    var headerRange = sheet.getRange(1, 1, 1, 10);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1A2744');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    // Set column widths
    sheet.setColumnWidth(1, 160);  // Lesson Date & Time
    sheet.setColumnWidth(2, 140);  // Student Name
    sheet.setColumnWidth(3, 200);  // Email
    sheet.setColumnWidth(4, 160);  // Course
    sheet.setColumnWidth(5, 80);   // Duration
    sheet.setColumnWidth(6, 100);  // Status
    sheet.setColumnWidth(7, 120);  // Platform
    sheet.setColumnWidth(8, 160);  // Cancelled Date & Time
    sheet.setColumnWidth(9, 120);  // Cancel Notice
    sheet.setColumnWidth(10, 200); // Notes
    // Freeze header row
    sheet.setFrozenRows(1);
  }

  // Parse the lesson datetime
  var lessonDate = data.startTime ? new Date(data.startTime) : '';
  var courseName = data.eventType || '';

  // Append the booking
  sheet.appendRow([
    lessonDate,
    data.name || '',
    data.email || '',
    courseName,
    '25 min',
    'Scheduled',
    '',   // Platform
    '',   // Cancelled Date & Time
    '',   // Cancel Notice (formula added below)
    ''    // Notes
  ]);

  var lastRow = sheet.getLastRow();

  // Format date column
  sheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd hh:mm AM/PM');

  // Add Cancel Notice formula (auto-calculates when cancellation date is entered)
  sheet.getRange(lastRow, 9).setFormula(
    '=IF(H' + lastRow + '="","",IF((A' + lastRow + '-H' + lastRow + ')*24>=24,"Outside 24hr","Inside 24hr"))'
  );

  // Style "Scheduled" status in teal
  var statusCell = sheet.getRange(lastRow, 6);
  statusCell.setFontColor('#2A9D8F');
  statusCell.setFontWeight('bold');

  // Highlight new row with light yellow
  sheet.getRange(lastRow, 1, 1, 10).setBackground('#FFF9E6');

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
        bookings.getRange(i, 1, 1, 10).setBackground(null);
      }
    }
  }
}
