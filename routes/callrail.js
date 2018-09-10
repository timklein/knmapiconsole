//Routes for Callrail Updates to Infusionsoft
const express = require('express');
const callrail = require('../controllers/callrailController');
const connections = require('../controllers/infusionsoftTokenController');
var router = express.Router();

// POST Callrail
router.post('/', callrail.createContact);

//GET Console page for CallRail Settings
router.get('/', connections.buildList, (req, res) => {
    res.render('callrail', {
        user : req.user,
        apps : req.apps
    });
});

module.exports = router;


// REMEMBER TO ADD ENSURELOGGEDIN!!!