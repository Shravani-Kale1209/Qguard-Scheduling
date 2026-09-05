import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function SlotSelection({ visitorData, onEditDetails, onConfirm }) {
  // Compute next valid weekday (Monday‑Friday) as default date
  const getNextWeekday = () => {
    const today = new Date();
    // Use local date parts to avoid UTC/local boundary issues
    const next = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    // skip weekends
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
    // Format as YYYY-MM-DD using local date parts
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    const d = String(next.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Normalize timezone alias
  const normalizeTimezone = (tz) => (tz === 'Asia/Calcutta' ? 'Asia/Kolkata' : tz);

  const [date, setDate] = useState(() => getNextWeekday());
  const [timezone, setTimezone] = useState(() => normalizeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

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

  const fetchSlots = async (selectedDate, tz) => {
    setLoading(true);
    setError(null);
    try {
      const normalizedTz = normalizeTimezone(tz);
      const resp = await fetch(`http://localhost:4000/api/slots?date=${selectedDate}&timezone=${encodeURIComponent(normalizedTz)}`);
      if (!resp.ok) throw new Error('Failed to load slots');
      const data = await resp.json();
      setSlots(data.slots || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots(date, timezone);
  }, [date, timezone]);

  const handleSubmit = () => {
    if (selectedSlot) {
      onConfirm({ ...selectedSlot, timezone: normalizeTimezone(timezone) });
    }
  };

  const formatTime = (isoString) => {
    const dateObj = new Date(isoString);
    const tz = normalizeTimezone(timezone);
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: tz });
  };

  return (
    <div className="form-wrapper">
      <div className="step-indicator">
        <span className="step-badge">Step 2 of 3</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Select Time Slot</span>
      </div>

      <h2 className="step-title">Select Demo Time Slot</h2>

      <div className="form-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <label htmlFor="date" className="form-label">Date</label>
          <input id="date" type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
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

        {loading && (
          <div className="loading"><Loader2 className="spin" size={24} /> Loading slots...</div>
        )}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && (
          <div className="slot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
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

      <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
        <button type="button" className="btn-secondary" onClick={onEditDetails} id="btn-back-to-details">
          <ArrowLeft size={16} />
          <span>Back to Details</span>
        </button>
        <button type="button" className="btn-primary" disabled={!selectedSlot} onClick={handleSubmit} id="btn-confirm-booking">
          Confirm Booking
        </button>
      </div>
    </div>
  );
}
