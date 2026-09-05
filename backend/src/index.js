'use strict';

/**
 * QGuard Demo Scheduling System – Express Entry Point
 */

require('dotenv/config');
const express = require('express');
// Custom CORS handling – allow only the two localhost origins
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

const { slotRouter } = require('./routes/slotRoutes');
const { bookingRouter } = require('./routes/bookingRoutes');
const app = express();
const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
// Apply CORS headers for every request
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin'); // Ensure caches vary by Origin
  }
  // Allow standard methods and headers
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // If this is a pre‑flight request, respond immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

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

const { verifyEmailConfiguration } = require('./services/emailService');

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const server = app.listen(PORT, async () => {
  console.log(`QGuard Scheduling Backend listening on http://localhost:${PORT}`);
  console.log(`  GET /api/slots?date=YYYY-MM-DD\u0026timezone=\u003cIANA\u003e`);
  console.log(`  GET /health`);
  
  // Verify SMTP configuration on startup
  await verifyEmailConfiguration();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Express] Error: Port ${PORT} is already in use (EADDRINUSE).`);
  } else {
    console.error('[Express] Server error:', err);
  }
  process.exit(1);
});

module.exports = app;
