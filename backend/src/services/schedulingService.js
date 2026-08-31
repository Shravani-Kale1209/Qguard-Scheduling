'use strict';

/**
 * Scheduling Service
 *
 * Generates 30-minute demo slots for a given date (Mon–Fri, 10:00–17:00)
 * in the user's timezone, then checks which slots are blocked by CONFIRMED
 * bookings in the database.
 *
 * Timezone strategy:
 *   • The `date` param is a calendar date in the user's `timezone`.
 *   • We build the slot windows in local time, then convert each boundary to
 *     UTC for the database query using Intl.DateTimeFormat offset arithmetic.
 *   • PostgreSQL stores startTime/endTime as UTC. We query:
 *       startTime >= <day-start UTC>  AND  startTime < <day-end UTC>
 *     and overlap-check each CONFIRMED booking against every slot.
 */

const { prisma } = require('../lib/prisma');

// Working hours (local time in the requested timezone)
const WORK_START_HOUR = 10; // 10:00
const WORK_END_HOUR = 17;   // 17:00
const SLOT_MINUTES = 30;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the UTC offset (in minutes) for a given timezone at a given instant.
 * Uses Intl.DateTimeFormat to determine what the local clock shows, then
 * computes offset = utcMs - localMs.
 *
 * @param {string} timezone  IANA timezone name, e.g. "Asia/Kolkata"
 * @param {Date}   date      Any Date object (used to determine DST offset)
 * @returns {number}         Offset in minutes (positive = east of UTC)
 */
function getUtcOffsetMinutes(timezone, date) {
  // Format the date in the given timezone and parse back to UTC equivalent
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

  const parts = formatter.formatToParts(date);
  const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);

  const year = get('year');
  const month = get('month') - 1; // months are 0-indexed in Date
  const day = get('day');
  let hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  // Handle midnight edge case (hour === 24)
  if (hour === 24) hour = 0;

  // Construct a UTC Date representing when the local clock shows this value
  const localAsUtc = Date.UTC(year, month, day, hour, minute, second);
  return Math.round((localAsUtc - date.getTime()) / 60000);
}

/**
 * Converts a local date-time (expressed as individual components in a given
 * timezone) to a UTC Date object.
 *
 * @param {string} timezone
 * @param {number} year
 * @param {number} month   1-indexed
 * @param {number} day
 * @param {number} hour
 * @param {number} minute
 * @returns {Date} UTC Date
 */
function localToUtc(timezone, year, month, day, hour, minute) {
  // First approximation: assume the offset at noon on that day
  const approxUtc = new Date(
    Date.UTC(year, month - 1, day, hour, minute)
  );

  // Get the real offset at our approximation
  const offsetMinutes = getUtcOffsetMinutes(timezone, approxUtc);

  // Adjust: localTime = utcTime + offset  →  utcTime = localTime - offset
  return new Date(approxUtc.getTime() - offsetMinutes * 60000);
}

/**
 * Validates that the provided string is a recognized IANA timezone.
 * @param {string} tz
 * @returns {boolean}
 */
function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a UTC Date as an ISO-8601 string in the given timezone.
 * e.g. "2026-09-05T10:00:00+05:30"
 *
 * @param {Date}   utcDate
 * @param {string} timezone
 * @returns {string}
 */
function formatInTimezone(utcDate, timezone) {
  // Get the local parts
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

  const parts = formatter.formatToParts(utcDate);
  const get = (type) => parts.find((p) => p.type === type).value;

  let hour = get('hour');
  // Intl may return "24" for midnight — normalise
  const hourNum = parseInt(hour, 10);
  const displayHour = hourNum === 24 ? '00' : hour.padStart(2, '0');

  const dateStr = `${get('year')}-${get('month')}-${get('day')}T${displayHour}:${get('minute')}:${get('second')}`;

  // Calculate offset string (+HH:MM or -HH:MM)
  const offsetMinutes = getUtcOffsetMinutes(timezone, utcDate);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const offsetMins = String(absOffset % 60).padStart(2, '0');

  return `${dateStr}${sign}${offsetHours}:${offsetMins}`;
}

// ---------------------------------------------------------------------------
// Core: get available slots for a date
// ---------------------------------------------------------------------------

/**
 * @param {string} dateStr   "YYYY-MM-DD" in the user's timezone
 * @param {string} timezone  IANA timezone name
 * @returns {Promise<Array<{start: string, end: string, available: boolean}>>}
 */
async function getAvailableSlots(dateStr, timezone) {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed
  const day = parseInt(dayStr, 10);

  // -------------------------------------------------------------------------
  // 1. Generate all 30-minute slots for the working day (local time)
  // -------------------------------------------------------------------------
  const slots = [];
  let currentHour = WORK_START_HOUR;
  let currentMinute = 0;

  while (
    currentHour < WORK_END_HOUR ||
    (currentHour === WORK_END_HOUR && currentMinute === 0)
  ) {
    const slotStartUtc = localToUtc(timezone, year, month, day, currentHour, currentMinute);

    let endMinute = currentMinute + SLOT_MINUTES;
    let endHour = currentHour;
    if (endMinute >= 60) {
      endHour += Math.floor(endMinute / 60);
      endMinute = endMinute % 60;
    }

    const slotEndUtc = localToUtc(timezone, year, month, day, endHour, endMinute);

    // Stop before the end of working hours
    if (endHour > WORK_END_HOUR || (endHour === WORK_END_HOUR && endMinute > 0)) {
      break;
    }

    slots.push({
      startUtc: slotStartUtc,
      endUtc: slotEndUtc,
      startDisplay: formatInTimezone(slotStartUtc, timezone),
      endDisplay: formatInTimezone(slotEndUtc, timezone),
    });

    // Advance by SLOT_MINUTES
    currentMinute += SLOT_MINUTES;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  // -------------------------------------------------------------------------
  // 2. Query existing CONFIRMED bookings that overlap with this day
  // -------------------------------------------------------------------------
  // Day boundaries in UTC (to narrow the DB query efficiently)
  const dayStartUtc = localToUtc(timezone, year, month, day, 0, 0);
  const dayEndUtc = localToUtc(timezone, year, month, day + 1, 0, 0);

  const confirmedBookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      startTime: {
        gte: dayStartUtc,
        lt: dayEndUtc,
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // -------------------------------------------------------------------------
  // 3. Mark slots as unavailable if any CONFIRMED booking overlaps
  //    Overlap condition: bookingStart < slotEnd && bookingEnd > slotStart
  // -------------------------------------------------------------------------
  const result = slots.map((slot) => {
    const isBlocked = confirmedBookings.some(
      (booking) =>
        booking.startTime < slot.endUtc && booking.endTime > slot.startUtc
    );

    return {
      start: slot.startDisplay,
      end: slot.endDisplay,
      available: !isBlocked,
    };
  });

  return result;
}

module.exports = { getAvailableSlots, isValidTimezone };
