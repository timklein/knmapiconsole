//Routes for Callrail Updates to Infusionsoft
const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const callrail = require('../controllers/callrailController');
const connections = require('../controllers/infusionsoftTokenController');
var router = express.Router();

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

module.exports = router;
