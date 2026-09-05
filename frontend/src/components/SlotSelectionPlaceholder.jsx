import React from 'react';
import { ArrowLeft, Calendar, User, Mail, Building, Briefcase, Phone, CheckCircle } from 'lucide-react';

export default function SlotSelectionPlaceholder({ visitorData, onEditDetails }) {
  return (
    <div className="form-wrapper">
      <div className="step-indicator">
        <span className="step-badge">Step 2 of 2</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Select Time Slot</span>
      </div>

      <h2 className="step-title">Select Demo Time Slot</h2>
      <p className="step-subtitle">
        Your visitor details have been saved in state. In Chunk 5B, the available 30-minute demo slots will be loaded here from <code>GET /api/slots</code>.
      </p>

      <div className="form-card" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} color="var(--success-green)" />
            <span>Visitor Information (Stored in State)</span>
          </h3>
          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={onEditDetails}>
            Edit Details
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>{visitorData.name}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Work Email</div>
            <div style={{ fontWeight: 600, color: 'var(--primary-cyan)', marginTop: '0.2rem' }}>{visitorData.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company</div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>{visitorData.company}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job Title</div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>{visitorData.jobTitle}</div>
          </div>
          {visitorData.phone && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>{visitorData.phone}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button className="btn-secondary" onClick={onEditDetails}>
          <ArrowLeft size={16} />
          <span>Back to Details Form</span>
        </button>
      </div>
    </div>
  );
}
