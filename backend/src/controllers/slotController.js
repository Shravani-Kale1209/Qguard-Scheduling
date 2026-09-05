'use strict';

/**
 * Slot Controller
 *
 * Handles GET /api/slots
 * Query params:
 *   date     – "YYYY-MM-DD" (in the user's timezone)
 *   timezone – IANA timezone name (e.g. "Asia/Kolkata")
 */

const { getAvailableSlots, isValidTimezone } = require('../services/schedulingService');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns a normalised "today" date string in the requested timezone so we
 * can reject past dates.
 *
 * @param {string} timezone
 * @returns {string}  "YYYY-MM-DD"
 */
function todayInTimezone(timezone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // en-CA gives YYYY-MM-DD
}

/**
 * Returns 0 (Sun) – 6 (Sat) for the day-of-week of the given local date.
 *
 * We build a UTC midnight for the date and then ask Intl what weekday it is
 * in the given timezone.
 *
 * @param {string} dateStr   "YYYY-MM-DD"
 * @param {string} timezone
 * @returns {number}         0 = Sunday … 6 = Saturday
 */
function localDayOfWeek(dateStr, timezone) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Use noon to avoid any midnight boundary issue
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const weekdayStr = formatter.format(noonUtc); // "Mon", "Tue", …
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return dayMap[weekdayStr];
}

/**
 * GET /api/slots
 */
async function getSlots(req, res) {
  const { date, timezone } = req.query;

  // ------------------------------------------------------------------
  // Validate required parameters
  // ------------------------------------------------------------------
  if (!date) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: date',
    });
  }

  if (!timezone) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: timezone',
    });
  }

  // ------------------------------------------------------------------
  // Normalize deprecated timezone aliases
  // ------------------------------------------------------------------
  const normalizedTimezone = timezone === 'Asia/Calcutta' ? 'Asia/Kolkata' : timezone;

  // ------------------------------------------------------------------
  // Validate date format
  // ------------------------------------------------------------------
  if (!DATE_REGEX.test(date)) {
    return res.status(400).json({
      success: false,
      error: `Invalid date format "${date}". Expected YYYY-MM-DD.`,
    });
  }

  const [yearStr, monthStr, dayStr] = date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Validate calendar date (handles Feb 30, month 13, etc.)
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  if (
    dateObj.getUTCFullYear() !== year ||
    dateObj.getUTCMonth() + 1 !== month ||
    dateObj.getUTCDate() !== day
  ) {
    return res.status(400).json({
      success: false,
      error: `Invalid date: "${date}" is not a real calendar date.`,
    });
  }

  // ------------------------------------------------------------------
  // Validate timezone
  // ------------------------------------------------------------------
  if (!isValidTimezone(normalizedTimezone)) {
    return res.status(400).json({
      success: false,
      error: `Invalid timezone: "${timezone}". Use a valid IANA timezone name (e.g. "Asia/Kolkata", "America/New_York").`,
    });
  }

  // ------------------------------------------------------------------
  // Reject dates in the past (relative to the user's timezone)
  // ------------------------------------------------------------------
  const today = todayInTimezone(normalizedTimezone);
  if (date < today) {
    return res.status(400).json({
      success: false,
      error: `Cannot query slots for a past date. Today is ${today} in timezone "${normalizedTimezone}".`,
    });
  }

  // ------------------------------------------------------------------
  // Reject weekends
  // ------------------------------------------------------------------
  const dow = localDayOfWeek(date, normalizedTimezone);
  if (dow === 0 || dow === 6) {
    const dayName = dow === 0 ? 'Sunday' : 'Saturday';
    return res.status(200).json({
      success: true,
      date,
      timezone: normalizedTimezone,
      slots: [],
      message: `No slots available on ${dayName}s. Demo bookings are available Monday – Friday only.`,
    });
  }

  // ------------------------------------------------------------------
  // Fetch and return available slots
  // ------------------------------------------------------------------
  try {
    const slots = await getAvailableSlots(date, normalizedTimezone);

    return res.status(200).json({
      success: true,
      date,
      timezone: normalizedTimezone,
      slots,
    });
  } catch (err) {
    console.error('[slotController] Error fetching slots:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while fetching available slots.',
    });
  }
}

module.exports = { getSlots };
