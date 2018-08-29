//Routes for Callrail Updates to Infusionsoft
const express = require('express');
const callrail = require('../controllers/callrailController');
var router = express.Router();

// POST Callrail
router.post('/', callrail.createContact);

module.exports = router;
