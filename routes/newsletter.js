//Routes for Newletter COnfiguration
const express = require('express');
// const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var router = express.Router();

//GET Console page for CallRail Settings
router.get('/', (req, res) => {
    res.render('newsletter', {
        user : req.user
    });
});

module.exports = router;
