//Routes for Newletter COnfiguration
const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var router = express.Router();
const connections = require('../controllers/infusionsoftTokenController');

//GET Console page for CallRail Settings
router.get('/', ensureLoggedIn, connections.buildList, (req, res) => {
    res.render('newsletter', {
        user : req.user,
        apps : req.apps
    });
});

module.exports = router;
