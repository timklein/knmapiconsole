//Routes for Callrail Updates to Infusionsoft
const express = require('express');
const callrail = require('../controllers/callrailController');
var router = express.Router();

// POST Callrail
router.post('/', callrail.createContact);

//GET Console page for CallRail Settings
router.get('/', (req, res) => res.render('callrail', { user : req.user }));

module.exports = router;


// REMEMBER TO ADD ENSURELOGGEDIN!!!