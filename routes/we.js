//Routes for Wealthengine Data Retrieval
const express = require('express');
const we = require('../controllers/wealthengineController');
// const connections = require('../controllers/infusionsoftTokenController');
var router = express.Router();

// POST Callrail
router.post('/', we.test);

module.exports = router;