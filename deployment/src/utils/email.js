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

