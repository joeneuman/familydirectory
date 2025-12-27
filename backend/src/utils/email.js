import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  console.log('Email service mode:', process.env.EMAIL_SERVICE || 'not set (will use console)');

  // For SendGrid or similar SMTP
  if (process.env.EMAIL_SERVICE === 'smtp') {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Fallback: console log for development
    console.warn('Email service not configured. Magic links will be logged to console.');
    transporter = {
      sendMail: async (options) => {
        console.log('=== EMAIL (Development Mode) ===');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Text:', options.text);
        console.log('HTML:', options.html);
        console.log('===============================');
        return { messageId: 'dev-' + Date.now() };
      },
    };
  }

  return transporter;
}

export async function sendMagicLink(email, token) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@familydirectory.com',
    to: email,
    subject: 'Your Family Directory Login Link',
    text: `Click this link to log in to the Family Directory:\n\n${magicLink}\n\nThis link will expire in 15 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Family Directory Login</h2>
        <p>Click the button below to log in to your Family Directory account:</p>
        <a href="${magicLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Log In
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${magicLink}</p>
        <p style="color: #999; font-size: 12px;">This link will expire in 15 minutes.</p>
      </div>
    `,
  };

  try {
    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendErrorReport(errorReport) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || process.env.EMAIL_FROM || 'admin@familydirectory.com';
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@familydirectory.com',
    to: adminEmail,
    subject: `[Family Directory] Error Report - ${new Date().toLocaleString()}`,
    text: formatErrorReportText(errorReport),
    html: formatErrorReportHTML(errorReport),
  };

  try {
    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending error report email:', error);
    throw error;
  }
}

function formatErrorReportText(errorReport) {
  return `
Error Report - Family Directory
${'='.repeat(50)}

Timestamp: ${errorReport.timestamp}
URL: ${errorReport.url}

User Information:
${errorReport.userName ? `  Name: ${errorReport.userName}` : '  Name: Not provided'}
${errorReport.userEmail ? `  Email: ${errorReport.userEmail}` : '  Email: Not provided'}
${errorReport.userId ? `  User ID: ${errorReport.userId}` : '  User ID: Not logged in'}

Description:
${errorReport.description}

Steps to Reproduce:
${errorReport.steps || 'Not provided'}

Error Details:
${errorReport.errorDetails || 'No error details provided'}

Technical Information:
User Agent: ${errorReport.userAgent}
  `.trim();
}

function formatErrorReportHTML(errorReport) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
        .section { margin-bottom: 20px; }
        .section-title { font-weight: bold; color: #1f2937; margin-bottom: 8px; font-size: 16px; }
        .field { margin-bottom: 12px; }
        .field-label { font-weight: 600; color: #4b5563; }
        .field-value { color: #1f2937; margin-top: 4px; padding: 8px; background-color: white; border-radius: 4px; border: 1px solid #e5e7eb; }
        .error-details { background-color: #fee2e2; border: 1px solid #fecaca; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">Error Report - Family Directory</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;">${new Date(errorReport.timestamp).toLocaleString()}</p>
      </div>
      <div class="content">
        <div class="section">
          <div class="section-title">User Information</div>
          <div class="field">
            <div class="field-label">Name:</div>
            <div class="field-value">${errorReport.userName || 'Not provided'}</div>
          </div>
          <div class="field">
            <div class="field-label">Email:</div>
            <div class="field-value">${errorReport.userEmail || 'Not provided'}</div>
          </div>
          <div class="field">
            <div class="field-label">User ID:</div>
            <div class="field-value">${errorReport.userId || 'Not logged in'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Description</div>
          <div class="field-value">${errorReport.description.replace(/\n/g, '<br>')}</div>
        </div>
        
        ${errorReport.steps ? `
        <div class="section">
          <div class="section-title">Steps to Reproduce</div>
          <div class="field-value">${errorReport.steps.replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}
        
        ${errorReport.errorDetails ? `
        <div class="section">
          <div class="section-title">Error Details</div>
          <div class="error-details">${errorReport.errorDetails.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
        ` : ''}
        
        <div class="section">
          <div class="section-title">Technical Information</div>
          <div class="field">
            <div class="field-label">URL:</div>
            <div class="field-value">${errorReport.url}</div>
          </div>
          <div class="field">
            <div class="field-label">User Agent:</div>
            <div class="field-value" style="font-size: 11px;">${errorReport.userAgent}</div>
          </div>
        </div>
      </div>
      <div class="footer">
        This error report was automatically generated by the Family Directory application.
      </div>
    </body>
    </html>
  `.trim();
}
