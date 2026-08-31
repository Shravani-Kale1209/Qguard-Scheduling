'use strict';

const { z } = require('zod');
const { createBooking } = require('../services/bookingService');
const { isValidTimezone } = require('../services/schedulingService');

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
    // 1. Validate payload with Zod
    const parsed = bookingSchema.safeParse(req.body);
    
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

module.exports = { createBookingHandler };
