//Routes for Newletter COnfiguration
const express = require('express');
const router = express.Router();
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const connections = require('../controllers/infusionsoftTokenController');
const newsletter = require('../controllers/newsletterController');

//GET Console page for Newsletter Settings
router.get('/', ensureLoggedIn, connections.buildList, newsletter.configList, (req, res) => {
    console.log(req.configurations);
    res.render('newsletter', {
        user : req.user,
        apps : req.apps,
        configurations : req.configurations
    });
});

router.get('/rssconfig', newsletter.createConfig);

module.exports = router;
