'use strict';

/**
 * Slot Routes
 * Mounts at /api/slots (registered in index.js as app.use('/api', slotRouter))
 */

const { Router } = require('express');
const { getSlots } = require('../controllers/slotController');

const slotRouter = Router();

// GET /api/slots?date=YYYY-MM-DD&timezone=<IANA>
slotRouter.get('/slots', getSlots);

module.exports = { slotRouter };
