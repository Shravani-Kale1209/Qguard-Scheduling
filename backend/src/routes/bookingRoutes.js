'use strict';

const { Router } = require('express');
const { createBookingHandler } = require('../controllers/bookingController');

const bookingRouter = Router();

// POST /api/bookings
bookingRouter.post('/bookings', createBookingHandler);

module.exports = { bookingRouter };
