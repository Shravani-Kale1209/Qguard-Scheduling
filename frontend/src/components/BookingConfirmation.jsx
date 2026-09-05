import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function BookingConfirmation({ booking, onBack }) {
  // Safely format start and end times using the timezone returned by the booking
  const tz = booking.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const start = booking.startTime ? new Date(booking.startTime).toLocaleString([], { timeZone: tz }) : '';
  const end = booking.endTime ? new Date(booking.endTime).toLocaleString([], { timeZone: tz }) : '';
  const timezone = tz;

  return (
    <div className="form-wrapper">
      <div className="step-indicator">
        <span className="step-badge">Step 4 of 4</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Booking Confirmed</span>
      </div>

      <h2 className="step-title">Your Demo is Booked!</h2>

      <div className="form-card" style={{ marginBottom: '1.5rem' }}>
        <p><strong>Booking ID:</strong> {booking.id}</p>
        <p><strong>Name:</strong> {booking.name}</p>
        <p><strong>Email:</strong> {booking.email}</p>
        <p><strong>Company:</strong> {booking.company}</p>
        <p><strong>Job Title:</strong> {booking.jobTitle}</p>
        {booking.phone && (
          <p><strong>Phone:</strong> {booking.phone}</p>
        )}
        <p><strong>Demo Start:</strong> {start} ({timezone})</p>
        <p><strong>Demo End:</strong> {end} ({timezone})</p>
        
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            <strong>Need to make changes later?</strong> You can reschedule or cancel your demo using the links provided in your confirmation email.
          </p>
        </div>
      </div>

      <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
        <button type="button" className="btn-primary" onClick={onBack} id="btn-back-to-landing">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
}
