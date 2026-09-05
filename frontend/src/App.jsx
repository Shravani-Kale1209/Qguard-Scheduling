import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import VisitorForm from './components/VisitorForm';
import SlotSelection from './components/SlotSelection';
import BookingReview from './components/BookingReview';
import BookingConfirmation from './components/BookingConfirmation';
import Reschedule from './components/Reschedule';
import Cancel from './components/Cancel';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // landing, form, slots, review, confirm, reschedule, cancel
  const [visitorData, setVisitorData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(null);

  // Detect URL for reschedule or cancel on load
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/reschedule/')) {
      setCurrentView('reschedule');
    } else if (path.startsWith('/cancel/')) {
      setCurrentView('cancel');
    }
  }, []);

  const handleStartSchedule = () => setCurrentView('form');
  const handleBackToLanding = () => setCurrentView('landing');
  const handleBackToForm = () => setCurrentView('form');

  const handleFormSubmit = (data) => {
    setVisitorData(data);
    setCurrentView('slots');
  };

  const handleSlotConfirm = (slot) => {
    setSelectedSlot(slot);
    setCurrentView('review');
  };

  const handleBookingConfirm = async () => {
    if (!visitorData || !selectedSlot) return;
    try {
      const payload = {
        ...visitorData,
        startTime: selectedSlot.start,
        timezone: selectedSlot.timezone,
      };
      const resp = await fetch('http://localhost:4000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Booking failed');
      const data = await resp.json();
      setBooking(data.booking);
      setCurrentView('confirm');
    } catch (e) {
      console.error(e);
      alert('Error creating booking');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onScheduleClick={handleStartSchedule} />;
      case 'form':
        return (
          <VisitorForm
            initialData={visitorData}
            onSubmit={handleFormSubmit}
            onBack={handleBackToLanding}
          />
        );
      case 'slots':
        return (
          <SlotSelection
            visitorData={visitorData}
            onEditDetails={handleBackToForm}
            onConfirm={handleSlotConfirm}
          />
        );
      case 'review':
        return (
          <BookingReview
            visitorData={visitorData}
            selectedSlot={selectedSlot}
            onBack={handleBackToForm}
            onConfirm={handleBookingConfirm}
          />
        );
      case 'confirm':
        return <BookingConfirmation booking={booking} onBack={handleBackToLanding} />;
      case 'reschedule': {
        const token = window.location.pathname.split('/').pop();
        return <Reschedule token={token} />;
      }
      case 'cancel': {
        const token = window.location.pathname.split('/').pop();
        return <Cancel token={token} />;
      }
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      <Navbar onReset={handleBackToLanding} />
      <main className="main-content">{renderView()}</main>
      <footer className="footer">
        <p>&copy; 2026 QGuard Cyber Security Inc. All rights reserved. Quantum-Safe Infrastructure Architecture.</p>
      </footer>
    </div>
  );
}
