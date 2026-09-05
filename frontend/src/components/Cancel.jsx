import React, { useEffect, useState } from 'react';
import { Loader2, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function Cancel({ token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  useEffect(() => {
    // token obtained from URL params via useParams
    if (token) fetchBooking();
  }, [token]);

  const fetchBooking = async () => {
    setLoadingBooking(true);
    setError(null);
    try {
      const resp = await fetch(`http://localhost:4000/api/bookings/${token}`);
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.message || data.error || 'Booking not found or link is invalid.');
      }
      const bookingData = data.booking || data;
      setBooking(bookingData);
    } catch (e) {
      setError(e.message || 'Booking not found or link is invalid.');
    } finally {
      setLoadingBooking(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`http://localhost:4000/api/bookings/${token}/cancel`, {
        method: 'POST',
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || data.message || 'Cancel request failed');
      }
      setResult(data);
      // Optionally update booking status locally to reflect cancellation
      setBooking(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (iso, tz) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short', timeZone: tz });
    } catch {
      return iso;
    }
  };

  return (
    <div className="form-wrapper">
      <div className="step-indicator">
        <span className="step-badge" style={{ color: 'var(--danger-red)', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' }}>Cancel Demo</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Cancel Booking</span>
      </div>

      <h2 className="step-title">Cancel Demo Booking</h2>

      {loadingBooking && !booking && (
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

      {result ? (
        <div className="form-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <CheckCircle size={48} color="var(--success-green)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Cancelled Successfully</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your demo has been successfully cancelled.</p>
        </div>
      ) : (
        booking && (
          <>
            {booking.status === 'CANCELLED' && !result ? (
              <div className="form-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
                <CheckCircle size={48} color="var(--success-green)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Already Cancelled</h3>
                <p style={{ color: 'var(--text-muted)' }}>This QGuard demo booking has already been cancelled.</p>
              </div>
            ) : (
              <>
                <div className="form-card" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                      Booking Details
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>{booking.name} ({booking.company})</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{booking.email}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--primary-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={16} /> {formatDateTime(booking.startTime, booking.timezone)}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                          {booking.timezone}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0' }}>
                    Are you sure you want to cancel this demo? This action cannot be undone.
                  </p>
                  
                  {error && (
                    <div className="error-message" style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                      <AlertCircle size={18} /> {error}
                    </div>
                  )}
                </div>

                <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ background: 'var(--danger-red)', boxShadow: '0 0 25px rgba(239, 68, 68, 0.35)', color: '#fff' }}
                    disabled={loading} 
                    onClick={handleCancel}
                  >
                    {loading && <Loader2 className="spin" size={16} />}
                    <XCircle size={18} />
                    <span>Confirm Cancellation</span>
                  </button>
                </div>
              </>
            )}
          </>
        )
      )}
    </div>
  );
}
