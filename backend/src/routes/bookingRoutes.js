'use strict';

const { Router } = require('express');
const { 
  createBookingHandler, 
  getBookingHandler, 
  cancelBookingHandler, 
  rescheduleBookingHandler 
} = require('../controllers/bookingController');

const bookingRouter = Router();

// POST /api/bookings
bookingRouter.post('/bookings', createBookingHandler);

// GET /api/bookings/:token
bookingRouter.get('/bookings/:token', getBookingHandler);

// POST /api/bookings/:cancelToken/cancel
bookingRouter.post('/bookings/:cancelToken/cancel', cancelBookingHandler);

// POST /api/bookings/:rescheduleToken/reschedule
bookingRouter.post('/bookings/:rescheduleToken/reschedule', rescheduleBookingHandler);

module.exports = { bookingRouter };
