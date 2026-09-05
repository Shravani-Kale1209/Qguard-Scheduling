'use strict';

const { z } = require('zod');
const { createBooking, getBooking, cancelBooking, rescheduleBooking } = require('../services/bookingService');
const { isValidTimezone } = require('../services/schedulingService');

// Normalize deprecated timezone aliases (e.g. Asia/Calcutta -> Asia/Kolkata)
const normalizeTimezone = (tz) => (tz === 'Asia/Calcutta' ? 'Asia/Kolkata' : tz);

// Zod schema for validating the incoming payload
const bookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  company: z.string().min(1, 'Company is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  phone: z.string().optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid datetime format for startTime',
  }),
  timezone: z.string().refine((val) => isValidTimezone(val), {
    message: 'Invalid timezone name',
  }),
});

/**
 * Returns a normalised "today" date-time in the requested timezone so we
 * can reject past dates.
 *
 * @param {string} timezone
 * @returns {Date} 
 */
function getNowInTimezone(timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
  
  let hour = get('hour');
  if (hour === 24) hour = 0;
  
  // Return the UTC date that corresponds to "now" in the user's timezone? 
  // No, actually, "now" is universal. We just compare the startTime against Date.now().
  // If the slot is in the past globally, it's in the past.
  return new Date(); 
}

/**
 * POST /api/bookings
 */
async function createBookingHandler(req, res) {
  try {
    // 1. Normalize timezone before validation
    const body = { ...req.body };
    if (body.timezone) body.timezone = normalizeTimezone(body.timezone);

    // 2. Validate payload with Zod
    const parsed = bookingSchema.safeParse(body);
    
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ');
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${errorMsg}`,
      });
    }

    const data = parsed.data;

    // 2. Reject past dates universally
    const startTimeUtc = new Date(data.startTime);
    if (startTimeUtc.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot book a slot in the past.',
      });
    }

    // 3. Delegate to booking service
    const booking = await createBooking(data);

    // 4. Return successful response
    return res.status(201).json({
      success: true,
      message: 'Demo booked successfully',
      booking: {
        id: booking.id,
        name: booking.name,
        email: booking.email,
        company: booking.company,
        jobTitle: booking.jobTitle,
        phone: booking.phone || null,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        timezone: booking.timezone,
        status: booking.status,
        rescheduleToken: booking.rescheduleToken,
        cancelToken: booking.cancelToken,
      }
    });

  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        error: err.message,
      });
    }

    console.error('[bookingController] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while creating the booking.',
    });
  }
}

async function getBookingHandler(req, res) {
  try {
    const { token } = req.params;
    const booking = await getBooking(token);

    return res.status(200).json({
      success: true,
      booking: {
        name: booking.name,
        email: booking.email,
        company: booking.company,
        jobTitle: booking.jobTitle,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        timezone: booking.timezone,
        status: booking.status,
      }
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message, // Return "message" as requested
      });
    }
    console.error('[bookingController] Unexpected error in getBooking:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

async function cancelBookingHandler(req, res) {
  try {
    const { cancelToken } = req.params;
    await cancelBooking(cancelToken);

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    console.error('[bookingController] Unexpected error in cancelBooking:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

const rescheduleSchema = z.object({
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid datetime format for startTime',
  }),
  timezone: z.string().refine((val) => isValidTimezone(val), {
    message: 'Invalid timezone name',
  }),
});

async function rescheduleBookingHandler(req, res) {
  try {
    const { rescheduleToken } = req.params;

    // Normalize timezone alias before validation
    const body = { ...req.body };
    if (body.timezone) body.timezone = normalizeTimezone(body.timezone);

    const parsed = rescheduleSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => i.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation failed: ${errorMsg}`,
      });
    }

    const data = parsed.data;

    // Reject past dates universally
    const startTimeUtc = new Date(data.startTime);
    if (startTimeUtc.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule a slot into the past.',
      });
    }

    await rescheduleBooking(rescheduleToken, data);

    return res.status(200).json({
      success: true,
      message: 'Demo rescheduled successfully'
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    console.error('[bookingController] Unexpected error in rescheduleBooking:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = { createBookingHandler, getBookingHandler, cancelBookingHandler, rescheduleBookingHandler };
