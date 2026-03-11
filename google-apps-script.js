// =============================================================
// GOOGLE APPS SCRIPT — Paste this into your Google Sheet
// (See SETUP-GUIDE.txt for step-by-step instructions)
// =============================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);

    // Decide which sheet to use based on form type
    var sheetName = data.formType === 'Booking' ? 'Bookings' : 'Inquiries';
    var sheet = ss.getSheetByName(sheetName);

    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (sheetName === 'Bookings') {
        sheet.appendRow([
          'Timestamp', 'Name', 'Email', 'Country', 'Timezone',
          'Course', 'Time Slot', 'Lesson Focus'
        ]);
      } else {
        sheet.appendRow([
          'Timestamp', 'Name', 'Email', 'Country', 'Timezone',
          'Course', 'English Level', 'Lesson Focus', 'Message'
        ]);
      }
      // Bold the header row
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
    }

    // Append the data row
    if (sheetName === 'Bookings') {
      sheet.appendRow([
        new Date(),
        data.name || '',
        data.email || '',
        data.country || '',
        data.timezone || '',
        data.course || '',
        data.slot || '',
        data.focus || ''
      ]);
    } else {
      sheet.appendRow([
        new Date(),
        data.name || '',
        data.email || '',
        data.country || '',
        data.timezone || '',
        data.course || '',
        data.level || '',
        data.focus || '',
        data.message || ''
      ]);
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
