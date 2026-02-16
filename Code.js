// ============================================
// YACC 2025 REGISTRATION SYSTEM
// GOOGLE APPS SCRIPT BACKEND
// ============================================

// Configuration
const CONFIG = {
  spreadsheetId: '1XzZv9sR9YQ7W8P6oN5m4L3K2J1H0G9F8E7D6C5B4A3', // REPLACE WITH YOUR SHEET ID
  sheetName: 'Registrations',
  adminEmail: 'yacc2025connect@gmail.com'
};

// Main function to handle POST requests
function doPost(e) {
  try {
    console.log('Received POST request');
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    console.log('Action:', data.action);
    
    let response;
    
    switch (data.action) {
      case 'submitRegistration':
        response = handleRegistration(data);
        break;
      default:
        response = {
          success: false,
          message: 'Invalid action'
        };
    }
    
    // Return JSON response
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Server error: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  const html = HtmlService.createHtmlOutput('<h1>YACC 2025 Registration API</h1><p>API is running. Use POST requests to submit data.</p>');
  return html;
}

// Handle registration
function handleRegistration(data) {
  try {
    console.log('Processing registration for:', data.personal?.fullName);
    
    // Validate data
    if (!data.personal || !data.sports || data.sports.length === 0) {
      return {
        success: false,
        message: 'Missing required information'
      };
    }
    
    // Generate registration ID
    const registrationId = generateRegistrationId();
    
    // Save to spreadsheet
    const saveResult = saveToSpreadsheet(data, registrationId);
    
    if (!saveResult.success) {
      return saveResult;
    }
    
    // Send confirmation email
    sendConfirmationEmail(data, registrationId);
    
    // Send admin notification
    sendAdminNotification(data, registrationId);
    
    return {
      success: true,
      registrationId: registrationId,
      message: 'Registration successful! Confirmation email sent.'
    };
    
  } catch (error) {
    console.error('Error in handleRegistration:', error);
    return {
      success: false,
      message: 'Registration failed: ' + error.toString()
    };
  }
}

// Generate unique registration ID
function generateRegistrationId() {
  const date = new Date();
  const datePart = date.getFullYear().toString().slice(-2) + 
                   (date.getMonth() + 1).toString().padStart(2, '0') + 
                   date.getDate().toString().padStart(2, '0');
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return 'YACC' + datePart + randomPart;
}

// Save data to Google Sheet
function saveToSpreadsheet(data, registrationId) {
  try {
    // Open spreadsheet
    const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    let sheet = spreadsheet.getSheetByName(CONFIG.sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(CONFIG.sheetName);
      // Create headers
      const headers = [
        'Registration ID', 'Timestamp', 'Full Name', 'Age', 'Gender',
        'Contact', 'Email', 'Organization', 'Island', 'Sport ID',
        'Sport Name', 'Sport Type', 'Team Members Count', 'Coach Name',
        'Coach Position', 'Status', 'Payment Status', 'Notes'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
    
    // Prepare row data
    const now = new Date();
    const sport = data.sports[0];
    
    const rowData = [
      registrationId,
      now.toLocaleString(),
      data.personal.fullName,
      data.personal.age,
      data.personal.gender,
      data.personal.contact,
      data.personal.email,
      data.personal.organization,
      data.personal.island || '',
      sport.id,
      sport.name,
      sport.type,
      data.teamMembers ? data.teamMembers.length : 0,
      data.coach?.name || '',
      data.coach?.position || '',
      'Pending',
      'Unpaid',
      ''
    ];
    
    // Append data
    sheet.appendRow(rowData);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, rowData.length);
    
    return {
      success: true,
      row: sheet.getLastRow()
    };
    
  } catch (error) {
    console.error('Error saving to spreadsheet:', error);
    return {
      success: false,
      message: 'Failed to save to spreadsheet: ' + error.toString()
    };
  }
}

// Send confirmation email
function sendConfirmationEmail(data, registrationId) {
  try {
    const personal = data.personal;
    const sport = data.sports[0];
    
    const subject = `YACC 2025 Registration Confirmation - ${registrationId}`;
    
    const body = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px; background: #1e40af; color: white; padding: 20px; border-radius: 10px;">
              <h1 style="margin: 0;">YACC 2025</h1>
              <h2 style="margin: 10px 0 0 0;">Registration Confirmation</h2>
            </div>
            
            <p>Dear ${personal.fullName},</p>
            
            <p>Thank you for registering for the YACC 2025 Sports Event!</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #1e40af; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Registration Details</h3>
              <p><strong>Registration ID:</strong> ${registrationId}</p>
              <p><strong>Name:</strong> ${personal.fullName}</p>
              <p><strong>Sport:</strong> ${sport.name}</p>
              <p><strong>Organization:</strong> ${personal.organization}</p>
              <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Save your Registration ID: <strong>${registrationId}</strong></li>
              <li>Complete payment before December 20, 2025</li>
              <li>Bring this email and valid ID to the event</li>
              <li>Check-in at registration desk on event day</li>
            </ol>
            
            <div style="background: #fff3cd; padding: 15px; margin: 20px 0;">
              <h4 style="margin-top: 0;">Important Notes:</h4>
              <ul>
                <li>Registration deadline: December 20, 2025</li>
                <li>One sport per participant rule is strictly enforced</li>
                <li>Bring required equipment as specified in rules</li>
              </ul>
            </div>
            
            <p>For questions, contact:</p>
            <ul>
              <li>Pstr. Joven Borja: 0927-818-2968</li>
              <li>Email: yacc2025connect@gmail.com</li>
            </ul>
            
            <p>See you at the event!</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p>YACC 2025 Sports Committee</p>
              <p>Anilao National High School, Iloilo</p>
              <p>December 26-30, 2025</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    MailApp.sendEmail({
      to: personal.email,
      subject: subject,
      htmlBody: body
    });
    
    console.log('Confirmation email sent to:', personal.email);
    
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

// Send admin notification
function sendAdminNotification(data, registrationId) {
  try {
    const personal = data.personal;
    const sport = data.sports[0];
    
    const subject = `📋 New YACC 2025 Registration - ${registrationId}`;
    
    const body = `
      New registration received:
      
      Registration ID: ${registrationId}
      Name: ${personal.fullName}
      Age: ${personal.age}
      Gender: ${personal.gender}
      Contact: ${personal.contact}
      Email: ${personal.email}
      Organization: ${personal.organization}
      Island: ${personal.island || 'N/A'}
      
      Sport: ${sport.name} (${sport.type})
      Team Members: ${data.teamMembers ? data.teamMembers.length : 0}
      Coach: ${data.coach?.name || 'N/A'}
      
      Timestamp: ${new Date().toLocaleString()}
      
      View in spreadsheet: https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}
    `;
    
    MailApp.sendEmail({
      to: CONFIG.adminEmail,
      subject: subject,
      body: body
    });
    
    console.log('Admin notification sent');
    
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

// Create menu for admin
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('YACC 2025')
    .addItem('View Registrations', 'showRegistrations')
    .addItem('Send Test Email', 'sendTestEmail')
    .addToUi();
}

// Show all registrations
function showRegistrations() {
  const html = HtmlService.createHtmlOutput(`
    <h1>YACC 2025 Registrations</h1>
    <p>Total registrations will be shown here.</p>
    <button onclick="google.script.host.close()">Close</button>
  `).setWidth(400).setHeight(300);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Registrations');
}

// Send test email
function sendTestEmail() {
  const testData = {
    personal: {
      fullName: 'Test User',
      email: Session.getActiveUser().getEmail(),
      organization: 'Test Church'
    },
    sports: [{
      id: 'test',
      name: 'Test Sport',
      type: 'individual'
    }]
  };
  
  const registrationId = generateRegistrationId();
  sendConfirmationEmail(testData, registrationId);
  
  SpreadsheetApp.getUi().alert('Test email sent!');
}
