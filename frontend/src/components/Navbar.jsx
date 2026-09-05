import React from 'react';
import { Shield } from 'lucide-react';

export default function Navbar({ onReset }) {
  return (
    <header className="navbar">
      <div className="brand" onClick={onReset}>
        <div className="brand-icon">
          <Shield size={22} />
        </div>
        <span className="brand-name">QGUARD</span>
        <span className="brand-badge">PROT-v2.4</span>
      </div>

      <div className="nav-status">
        <span className="status-dot"></span>
        <span>Quantum-Safe Active</span>
      </div>
    </header>
  );
}
