'use strict';

/**
 * QGuard Demo Scheduling System – Express Entry Point
 */

require('dotenv/config');

const express = require('express');
const { slotRouter } = require('./routes/slotRoutes');
const { bookingRouter } = require('./routes/bookingRoutes');
const app = express();
const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api', slotRouter);
app.use('/api', bookingRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'qguard-scheduling-backend' });
});

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Express] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`QGuard Scheduling Backend listening on http://localhost:${PORT}`);
  console.log(`  GET /api/slots?date=YYYY-MM-DD&timezone=<IANA>`);
  console.log(`  GET /health`);
});

module.exports = app;
