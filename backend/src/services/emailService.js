'use strict';

const nodemailer = require('nodemailer');

/**
 * Creates a Nodemailer transporter based on environment configuration.
 * Supports standard SMTP settings from process.env.
 */
function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  // Use real SMTP if configured and not set to dummy placeholder
  if (host && host !== 'smtp.example.com' && user && pass && !host.includes('unreachable')) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback json transport for local testing/development
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

/**
 * Formats a Date object into a readable date-time string in the specified timezone.
 *
 * @param {Date} date
 * @param {string} timezone
 * @returns {string} Formatted date string
 */
function formatDateTime(date, timezone) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(date));
  } catch {
    return new Date(date).toISOString();
  }
}

/**
 * Formats a Date object to UTC ISO format for ICS files (YYYYMMDDTHHMMSSZ).
 *
 * @param {Date|string} date
 * @returns {string}
 */
function formatIcsDate(date) {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates an RFC 5545 compliant .ics calendar file content string.
 *
 * @param {Object} booking 
 * @param {'REQUEST'|'CANCEL'} method 
 * @param {number} sequence 
 * @returns {string}
 */
function generateIcsContent(booking, method = 'REQUEST', sequence = 0) {
  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(booking.startTime);
  const dtEnd = formatIcsDate(booking.endTime);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const rescheduleUrl = `${frontendUrl}/reschedule/${booking.rescheduleToken}`;
  const cancelUrl = `${frontendUrl}/cancel/${booking.cancelToken}`;
  const fromAddress = process.env.EMAIL_FROM || 'no-reply@qguard.io';

  const status = method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED';
  const summary = method === 'CANCEL' 
    ? `CANCELLED: QGuard Demo - ${booking.name}`
    : `QGuard Demo - ${booking.name}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QGuard//Demo Scheduling System//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:qguard-booking-${booking.id}@qguard.io`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:QGuard Demo Booking\\nName: ${booking.name}\\nCompany: ${booking.company}\\nJob Title: ${booking.jobTitle}\\n\\nReschedule: ${rescheduleUrl}\\nCancel: ${cancelUrl}`,
    `ORGANIZER;CN=QGuard Team:mailto:${fromAddress}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${booking.name}:mailto:${booking.email}`,
    `STATUS:${status}`,
    `SEQUENCE:${sequence}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Sends a demo booking confirmation email to the visitor with attached .ics calendar invite.
 *
 * @param {Object} booking - The created booking object from database
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendConfirmationEmail(booking) {
  try {
    const transporter = createTransporter();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const rescheduleUrl = `${frontendUrl}/reschedule/${booking.rescheduleToken}`;
    const cancelUrl = `${frontendUrl}/cancel/${booking.cancelToken}`;

    const formattedStart = formatDateTime(booking.startTime, booking.timezone);
    const formattedEnd = formatDateTime(booking.endTime, booking.timezone);
    const fromAddress = process.env.EMAIL_FROM || '"QGuard Demo" <no-reply@qguard.io>';

    const icsContent = generateIcsContent(booking, 'REQUEST', 0);

    const mailOptions = {
      from: fromAddress,
      to: booking.email,
      subject: `Confirmation: QGuard Demo Booking for ${booking.name}`,
      text: `Hello ${booking.name},

Thank you for scheduling a QGuard Demo! Here are your booking details:

- Name: ${booking.name}
- Company: ${booking.company}
- Job Title: ${booking.jobTitle}
- Start Time: ${formattedStart}
- End Time: ${formattedEnd}
- Timezone: ${booking.timezone}

A calendar invitation (invite.ics) has been attached to this email.

If you need to make changes to your booking, please use the links below:

Reschedule Demo:
${rescheduleUrl}

Cancel Demo:
${cancelUrl}

Best regards,
The QGuard Team`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2 style="color: #1a365d;">QGuard Demo Booking Confirmation</h2>
  <p>Hello <strong>${booking.name}</strong>,</p>
  <p>Thank you for scheduling a QGuard Demo! Here are your booking details:</p>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Company:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.company}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Job Title:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.jobTitle}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Start Time:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedStart}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">End Time:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedEnd}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Timezone:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.timezone}</td></tr>
  </table>

  <p>A calendar invitation (<code>invite.ics</code>) is attached to this email.</p>

  <p>If you need to make changes to your demo appointment, use the options below:</p>
  
  <div style="margin: 25px 0;">
    <a href="${rescheduleUrl}" style="background-color: #2b6cb0; color: white; padding: 10px 18px; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">Reschedule Demo</a>
    <a href="${cancelUrl}" style="background-color: #e53e3e; color: white; padding: 10px 18px; text-decoration: none; border-radius: 4px; display: inline-block;">Cancel Demo</a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  <p style="font-size: 12px; color: #718096;">QGuard Automated Scheduling System</p>
</div>`,
      icalEvent: {
        filename: 'invite.ics',
        method: 'REQUEST',
        content: icsContent,
      },
      attachments: [
        {
          filename: 'invite.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=UTF-8; method=REQUEST',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[emailService] Confirmation email sent to ${booking.email} (MessageId: ${info.messageId || 'json-mode'})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[emailService] Failed to send confirmation email to ${booking.email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a rescheduled demo confirmation email to the visitor with updated .ics calendar invite.
 *
 * @param {Object} booking - The updated booking object from database
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendRescheduleEmail(booking) {
  try {
    const transporter = createTransporter();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const rescheduleUrl = `${frontendUrl}/reschedule/${booking.rescheduleToken}`;
    const cancelUrl = `${frontendUrl}/cancel/${booking.cancelToken}`;

    const formattedStart = formatDateTime(booking.startTime, booking.timezone);
    const formattedEnd = formatDateTime(booking.endTime, booking.timezone);
    const fromAddress = process.env.EMAIL_FROM || '"QGuard Demo" <no-reply@qguard.io>';

    const icsContent = generateIcsContent(booking, 'REQUEST', 1);

    const mailOptions = {
      from: fromAddress,
      to: booking.email,
      subject: `Rescheduled: QGuard Demo Booking for ${booking.name}`,
      text: `Hello ${booking.name},

Your QGuard Demo has been successfully rescheduled. Here are your updated booking details:

- Name: ${booking.name}
- Company: ${booking.company}
- Job Title: ${booking.jobTitle}
- New Start Time: ${formattedStart}
- New End Time: ${formattedEnd}
- Timezone: ${booking.timezone}

An updated calendar invitation (invite.ics) has been attached to this email.

If you need to make further changes to your booking, please use the links below:

Reschedule Demo:
${rescheduleUrl}

Cancel Demo:
${cancelUrl}

Best regards,
The QGuard Team`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2 style="color: #2b6cb0;">QGuard Demo Rescheduled</h2>
  <p>Hello <strong>${booking.name}</strong>,</p>
  <p>Your QGuard Demo has been successfully rescheduled. Here are your updated booking details:</p>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Company:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.company}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Job Title:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.jobTitle}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">New Start Time:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedStart}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">New End Time:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedEnd}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Timezone:</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.timezone}</td></tr>
  </table>

  <p>An updated calendar invitation (<code>invite.ics</code>) is attached to this email.</p>

  <div style="margin: 25px 0;">
    <a href="${rescheduleUrl}" style="background-color: #2b6cb0; color: white; padding: 10px 18px; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">Reschedule Again</a>
    <a href="${cancelUrl}" style="background-color: #e53e3e; color: white; padding: 10px 18px; text-decoration: none; border-radius: 4px; display: inline-block;">Cancel Demo</a>
  </div>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  <p style="font-size: 12px; color: #718096;">QGuard Automated Scheduling System</p>
</div>`,
      icalEvent: {
        filename: 'invite.ics',
        method: 'REQUEST',
        content: icsContent,
      },
      attachments: [
        {
          filename: 'invite.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=UTF-8; method=REQUEST',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[emailService] Reschedule email sent to ${booking.email} (MessageId: ${info.messageId || 'json-mode'})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[emailService] Failed to send reschedule email to ${booking.email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a demo cancellation email to the visitor with a METHOD:CANCEL .ics calendar update.
 *
 * @param {Object} booking - The cancelled booking object from database
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendCancellationEmail(booking) {
  try {
    const transporter = createTransporter();

    const formattedStart = formatDateTime(booking.startTime, booking.timezone);
    const fromAddress = process.env.EMAIL_FROM || '"QGuard Demo" <no-reply@qguard.io>';

    const icsContent = generateIcsContent(booking, 'CANCEL', 2);

    const mailOptions = {
      from: fromAddress,
      to: booking.email,
      subject: `Cancelled: QGuard Demo Booking for ${booking.name}`,
      text: `Hello ${booking.name},

Your QGuard Demo scheduled for ${formattedStart} (${booking.timezone}) has been cancelled.

A cancellation update (invite.ics) has been attached to remove this event from your calendar.

Best regards,
The QGuard Team`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2 style="color: #e53e3e;">QGuard Demo Cancelled</h2>
  <p>Hello <strong>${booking.name}</strong>,</p>
  <p>Your QGuard Demo scheduled for <strong>${formattedStart} (${booking.timezone})</strong> has been cancelled.</p>
  <p>A calendar update (<code>invite.ics</code>) has been attached to automatically remove this event from your calendar.</p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  <p style="font-size: 12px; color: #718096;">QGuard Automated Scheduling System</p>
</div>`,
      icalEvent: {
        filename: 'invite.ics',
        method: 'CANCEL',
        content: icsContent,
      },
      attachments: [
        {
          filename: 'invite.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=UTF-8; method=CANCEL',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[emailService] Cancellation email sent to ${booking.email} (MessageId: ${info.messageId || 'json-mode'})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[emailService] Failed to send cancellation email to ${booking.email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Verifies the SMTP configuration on startup.
 * Logs success or safe error messages without exposing credentials.
 */
async function verifyEmailConfiguration() {
  const transporter = createTransporter();
  const host = process.env.EMAIL_HOST;

  // Check if we are using the JSON fallback
  if (!host || host === 'smtp.example.com' || host.includes('unreachable') || !process.env.EMAIL_USER) {
    console.log('[emailService] Using JSON test transport (real SMTP credentials not provided or using dummy host).');
    return;
  }

  try {
    await transporter.verify();
    console.log(`[emailService] Successfully connected to SMTP server at ${host}:${process.env.EMAIL_PORT || 587}`);
  } catch (err) {
    console.error(`[emailService] SMTP Verification Failed for ${host}:`, err.message);
    console.warn('[emailService] Emails will fail to send until SMTP credentials are fixed in .env');
  }
}

module.exports = { 
  sendConfirmationEmail, 
  sendRescheduleEmail, 
  sendCancellationEmail,
  verifyEmailConfiguration
};
