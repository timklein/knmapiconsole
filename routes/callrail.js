//Routes for Callrail Updates to Infusionsoft
const express = require('express');
var router = express.Router();
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const callrail = require('../controllers/callrailController');
const connections = require('../controllers/infusionsoftTokenController');
const knmapi = require('../controllers/knmapiController');

// POST Callrail
router.post('/', callrail.createContact);

//GET Console page for CallRail Settings
router.get('/', ensureLoggedIn, connections.buildList, callrail.configList, (req, res) => {
    res.render('callrail', {
        user : req.user,
        apps : req.apps,
        configurations : req.configurations
    });
});

router.get('/callconfig', callrail.createConfig);

router.post('/sms', knmapi.accessConfirmation, callrail.sendSMS);

module.exports = router;
