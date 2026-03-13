// =============================================================
// GOOGLE APPS SCRIPT — Paste this into your Google Sheet
// (See SETUP-GUIDE.txt for step-by-step instructions)
// =============================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);

    // All website contact form submissions go to Inquiries
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

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
