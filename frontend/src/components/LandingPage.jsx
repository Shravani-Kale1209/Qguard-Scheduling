import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Cpu, Lock, Sparkles } from 'lucide-react';

export default function LandingPage({ onScheduleClick }) {
  const [showManageMsg, setShowManageMsg] = useState(false);
  return (
    <div className="hero-container">
      <div className="hero-pill">
        <Sparkles size={16} />
        <span>Quantum-Safe Security Suite</span>
      </div>

      <h1 className="hero-title">
        Enterprise Security Built for the <span>Post-Quantum Era</span>
      </h1>

      <p className="hero-subtitle">
        Schedule a 1-on-1 technical demonstration with a QGuard security architect to explore our NIST-compliant post-quantum encryption, zero-trust infrastructure, and automated threat prevention.
      </p>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <ShieldCheck size={24} />
          </div>
          <h3 className="feature-title">Post-Quantum Cryptography</h3>
          <p className="feature-desc">
            Deploy lattice-based encryption algorithms engineered to withstand quantum computer decrypt attacks.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Lock size={24} />
          </div>
          <h3 className="feature-title">Zero-Trust Key Distribution</h3>
          <p className="feature-desc">
            Granular access controls with automated session key rotation and immutable secret isolation.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <Cpu size={24} />
          </div>
          <h3 className="feature-title">Real-Time Anomaly Engine</h3>
          <p className="feature-desc">
            AI-driven behavioral monitoring and instant payload threat mitigation for microservices.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={onScheduleClick} id="btn-schedule-demo">
          <span>Schedule a Demo</span>
          <ArrowRight size={20} />
        </button>
        <button className="btn-secondary" onClick={() => setShowManageMsg(!showManageMsg)} id="btn-manage-booking" style={{ backgroundColor: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Manage Booking</span>
        </button>
      </div>

      {showManageMsg && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', border: '1px solid var(--border-color)', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-dim)' }}>
            To protect your privacy, booking modifications require a secure token. 
            <strong> Please check your confirmation email for the secure Reschedule and Cancel links.</strong>
          </p>
        </div>
      )}
    </div>
  );
}
