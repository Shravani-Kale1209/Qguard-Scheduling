import React from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function BookingReview({ visitorData, selectedSlot, onBack, onConfirm }) {
  // Use the timezone that came from SlotSelection (normalized) if available
  const timezone = selectedSlot.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const start = new Date(selectedSlot.start).toLocaleString([], { timeZone: timezone });

  return (
    <div className="form-wrapper">
      <div className="step-indicator">
        <span className="step-badge">Step 3 of 3</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Review Booking</span>
      </div>

      <h2 className="step-title">Review Your Demo Booking</h2>

      <div className="form-card" style={{ marginBottom: '1.5rem' }}>
        <h3>{visitorData.name}</h3>
        <p><strong>Email:</strong> {visitorData.email}</p>
        <p><strong>Company:</strong> {visitorData.company}</p>
        <p><strong>Job Title:</strong> {visitorData.jobTitle}</p>
        {visitorData.phone && (
          <p><strong>Phone:</strong> {visitorData.phone}</p>
        )}
        <p><strong>Selected Slot:</strong> {start} ({timezone})</p>
      </div>

      <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
        <button type="button" className="btn-secondary" onClick={onBack} id="btn-back-to-slots">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button type="button" className="btn-primary" onClick={onConfirm} id="btn-submit-booking">
          <CheckCircle size={16} />
          <span>Confirm Booking</span>
        </button>
      </div>
    </div>
  );
}
