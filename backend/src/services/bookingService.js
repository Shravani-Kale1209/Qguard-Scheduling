'use strict';

const crypto = require('crypto');
const { prisma } = require('../lib/prisma');
const { getAvailableSlots } = require('./schedulingService');
const { 
  sendConfirmationEmail, 
  sendRescheduleEmail, 
  sendCancellationEmail 
} = require('./emailService');

/**
 * Returns 0 (Sun) - 6 (Sat) for the day-of-week of the given local date.
 * @param {string} dateStr "YYYY-MM-DD"
 * @param {string} timezone
 * @returns {number} 0 = Sunday ... 6 = Saturday
 */
function localDayOfWeek(dateStr, timezone) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const weekdayStr = formatter.format(noonUtc);
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return dayMap[weekdayStr];
}

/**
 * Validates slot availability and creates a booking.
 * 
 * @param {Object} data 
 * @returns {Promise<Object>} The created booking record
 */
async function createBooking(data) {
  const { name, email, company, jobTitle, phone, startTime, timezone } = data;

  // Generate secure tokens
  const rescheduleToken = crypto.randomBytes(32).toString('hex');
  const cancelToken = crypto.randomBytes(32).toString('hex');

  // Parse startTime to UTC Date object
  const startTimeUtc = new Date(startTime);
  
  // Calculate endTime (exactly 30 minutes later)
  const endTimeUtc = new Date(startTimeUtc.getTime() + 30 * 60000);

  // We should extract the date component (YYYY-MM-DD) in the user's timezone to check slots
  // Format the startTimeUtc in the requested timezone to get the date
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(startTimeUtc);

  // Reject weekends
  const dow = localDayOfWeek(dateStr, timezone);
  if (dow === 0 || dow === 6) {
    const error = new Error('Demo bookings are available Monday - Friday only.');
    error.status = 400;
    throw error;
  }

  // 1. Verify slot against scheduling logic (Mon-Fri, 10-17, etc.)
  const availableSlots = await getAvailableSlots(dateStr, timezone);
  
  // Find the exact slot requested
  const requestedSlot = availableSlots.find(
    (slot) => new Date(slot.start).getTime() === startTimeUtc.getTime()
  );

  if (!requestedSlot) {
    const error = new Error('Invalid slot. Slots must be exactly 30 minutes within working hours.');
    error.status = 400;
    throw error;
  }

  if (!requestedSlot.available) {
    const error = new Error('This slot is no longer available.');
    error.status = 409;
    throw error;
  }

  // 2. Create the booking. 
  // We use a database-level partial unique index:
  // CREATE UNIQUE INDEX "Booking_active_startTime_key" ON "Booking"("startTime") WHERE status = 'CONFIRMED';
  // This prevents race conditions where two requests pass the application-level check concurrently.
  try {
    const booking = await prisma.booking.create({
      data: {
        name,
        email,
        company,
        jobTitle,
        phone,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        timezone,
        status: 'CONFIRMED',
        rescheduleToken,
        cancelToken,
      },
    });

    // Automatically send confirmation email (failures will not roll back booking)
    sendConfirmationEmail(booking).catch((emailErr) => {
      console.error('[bookingService] Email sending failed asynchronously:', emailErr);
    });

    return booking;
  } catch (err) {
    // Check for Prisma unique constraint violation (P2002)
    if (err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('startTime')) {
      const error = new Error('This slot is no longer available.');
      error.status = 409;
      throw error;
    }
    // Also check standard postgres unique constraint error if adapter throws it differently
    if (err.message && err.message.includes('Booking_active_startTime_key')) {
      const error = new Error('This slot is no longer available.');
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

async function getBooking(token) {
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { rescheduleToken: token },
        { cancelToken: token }
      ]
    }
  });

  if (!booking) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }

  return booking;
}

async function cancelBooking(cancelToken) {
  const booking = await prisma.booking.findUnique({
    where: { cancelToken }
  });

  if (!booking) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }

  if (booking.status === 'CANCELLED') {
    const error = new Error('Booking is already cancelled');
    error.status = 409;
    throw error;
  }

  const updatedBooking = await prisma.booking.update({
    where: { cancelToken },
    data: { status: 'CANCELLED' }
  });

  sendCancellationEmail(updatedBooking).catch((emailErr) => {
    console.error('[bookingService] Cancellation email sending failed asynchronously:', emailErr);
  });
}

async function rescheduleBooking(rescheduleToken, data) {
  const { startTime, timezone } = data;

  const booking = await prisma.booking.findUnique({
    where: { rescheduleToken }
  });

  if (!booking) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }

  if (booking.status === 'CANCELLED') {
    const error = new Error('Cancelled bookings cannot be rescheduled.');
    error.status = 409;
    throw error;
  }

  const startTimeUtc = new Date(startTime);
  const endTimeUtc = new Date(startTimeUtc.getTime() + 30 * 60000);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(startTimeUtc);

  const dow = localDayOfWeek(dateStr, timezone);
  if (dow === 0 || dow === 6) {
    const error = new Error('Demo bookings are available Monday - Friday only.');
    error.status = 400;
    throw error;
  }

  const availableSlots = await getAvailableSlots(dateStr, timezone);
  
  const requestedSlot = availableSlots.find(
    (slot) => new Date(slot.start).getTime() === startTimeUtc.getTime()
  );

  if (!requestedSlot) {
    const error = new Error('Invalid slot. Slots must be exactly 30 minutes within working hours.');
    error.status = 400;
    throw error;
  }

  if (!requestedSlot.available) {
    const error = new Error('The selected slot is no longer available.');
    error.status = 409;
    throw error;
  }

  try {
    const updated = await prisma.booking.update({
      where: { rescheduleToken },
      data: {
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        timezone
      }
    });

    sendRescheduleEmail(updated).catch((emailErr) => {
      console.error('[bookingService] Reschedule email sending failed asynchronously:', emailErr);
    });

    return updated;
  } catch (err) {
    if (err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('startTime')) {
      const error = new Error('The selected slot is no longer available.');
      error.status = 409;
      throw error;
    }
    if (err.message && err.message.includes('Booking_active_startTime_key')) {
      const error = new Error('The selected slot is no longer available.');
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

module.exports = { createBooking, getBooking, cancelBooking, rescheduleBooking };
