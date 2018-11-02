//Routes for Wealthengine Data Retrieval
const express = require('express');
const router = express.Router();
const we = require('../controllers/wealthengineController');
const knmapi = require('../controllers/knmapiController');
// const connections = require('../controllers/infusionsoftTokenController');

// POST Callrail
router.post('/', knmapi.accessConfirmation, we.retrieveData, we.update, we.updateScore);

module.exports = router;
