import React, { useEffect, useState } from 'react';
import { Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const normalizeTimezone = (tz) => (tz === 'Asia/Calcutta' ? 'Asia/Kolkata' : tz);

export default function Reschedule({ token }) {
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [date, setDate] = useState('');
  const [timezone, setTimezone] = useState(() => normalizeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(null);

  const commonTimezones = [
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'Europe/London',
    'Europe/Paris',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Australia/Sydney',
    'UTC'
  ];

  // Fetch booking details using token
  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`http://localhost:4000/api/bookings/${token}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || data.error || 'Booking not found or link is invalid.');
      }
      const bookingData = data.booking || data;
      setBooking(bookingData);
      
      const bTz = normalizeTimezone(bookingData.timezone || timezone);
      setTimezone(bTz);

      if (bookingData.startTime) {
        const currentDate = new Date(bookingData.startTime).toLocaleDateString('en-CA', { timeZone: bTz });
        setDate(currentDate);
      }
    } catch (e) {
      setError(e.message || 'Booking not found or link is invalid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBooking();
  }, [token]);

  // Fetch available slots when date or timezone changes
  const fetchSlots = async (selectedDate, tz) => {
    if (!selectedDate || !booking || booking.status === 'CANCELLED') return;
    setSlotsLoading(true);
    setError(null);
    try {
      const normalizedTz = normalizeTimezone(tz);
      const resp = await fetch(`http://localhost:4000/api/slots?date=${selectedDate}&timezone=${encodeURIComponent(normalizedTz)}`);
      if (!resp.ok) throw new Error('Failed to load available slots');
      const data = await resp.json();
      setSlots(data.slots || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (date && booking && booking.status !== 'CANCELLED') {
      fetchSlots(date, timezone);
    }
  }, [date, timezone, booking]);

  const handleReschedule = async () => {
    if (!selectedSlot || !booking || booking.status === 'CANCELLED') return;
    setLoading(true);
    setError(null);
    try {
      const tz = normalizeTimezone(timezone);
      const resp = await fetch(`http://localhost:4000/api/bookings/${token}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: selectedSlot.start, timezone: tz }),
      });
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || errData.message || 'Reschedule failed');
      }
      setRescheduleSuccess(`Your demo has been successfully rescheduled!`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const dateObj = new Date(isoString);
    const tz = normalizeTimezone(timezone);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: tz });
  };

  const formatDateTime = (iso) => {
    if (!iso) return '';
    try {
      const tz = normalizeTimezone(timezone);
      return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short', timeZone: tz });
    } catch {
      return iso;
    }
  };

  return (
    <div className="form-wrapper">
      <div className="step-indicator">
        <span className="step-badge">Reschedule</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Update Time Slot</span>
      </div>

      <h2 className="step-title">Reschedule Demo Time Slot</h2>

      {loading && !booking && (
        <div className="loading" style={{ margin: '2rem 0', textAlign: 'center' }}>
          <Loader2 className="spin" size={24} /> Loading booking details...
        </div>
      )}

      {error && !booking && (
        <div className="form-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <AlertCircle size={48} color="var(--danger-red)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {error}
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Please check the link provided in your confirmation email or contact support.
          </p>
        </div>
      )}

      {!loading && booking && booking.status === 'CANCELLED' && (
        <div className="form-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <AlertCircle size={48} color="var(--danger-red)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Your QGuard demo has been cancelled.
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            This booking can no longer be rescheduled.
          </p>
        </div>
      )}

      {!loading && !error && rescheduleSuccess && (
        <div className="form-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <CheckCircle size={48} color="var(--success-green)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Rescheduled Successfully!</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{rescheduleSuccess}</p>
          {selectedSlot && (
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-cyan)' }}>
              New Time: {formatDateTime(selectedSlot.start)} ({timezone})
            </p>
          )}
        </div>
      )}

      {!loading && !error && !rescheduleSuccess && booking && booking.status !== 'CANCELLED' && (
        <>
          <div className="form-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                Current Booking
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>{booking.name} ({booking.company})</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{booking.email}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--primary-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={16} /> {formatDateTime(booking.startTime)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '160px' }}>
                <label htmlFor="date" className="form-label">Select New Date</label>
                <input id="date" type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div style={{ flex: '1', minWidth: '160px' }}>
                <label htmlFor="timezone" className="form-label">Timezone</label>
                <select id="timezone" className="form-input" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  {!commonTimezones.includes(normalizeTimezone(timezone)) && <option value={timezone}>{timezone}</option>}
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Central European Time (CET)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                  <option value="Australia/Sydney">Australian Eastern Time (AET)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            {slotsLoading && (
              <div className="loading" style={{ margin: '1.5rem 0', textAlign: 'center' }}>
                <Loader2 className="spin" size={24} /> Loading available slots...
              </div>
            )}

            {!slotsLoading && (
              <div className="slot-grid">
                {slots.map((slot) => {
                  const label = `${formatTime(slot.start)} – ${formatTime(slot.end)}`;
                  const isSelected = selectedSlot && selectedSlot.start === slot.start && selectedSlot.end === slot.end;
                  return (
                    <button
                      key={slot.start}
                      className={`slot-btn ${slot.available ? '' : 'disabled'} ${isSelected ? 'selected' : ''}`}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn-primary" disabled={!selectedSlot || loading} onClick={handleReschedule} id="btn-confirm-reschedule">
              {loading && <Loader2 className="spin" size={16} />}
              <span>Confirm Reschedule</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
