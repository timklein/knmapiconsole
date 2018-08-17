//Routes to authenticate with the Infusionsoft API
const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const infusionsoftTokenController = require('../controllers/infusionsoftTokenController');
var router = express.Router();

// Page redirect to authorization URL
router.get('/', ensureLoggedIn, infusionsoftTokenController.authorize);

// Callback service parsing the authorization code and requesting an access token
router.get('/callback', ensureLoggedIn, infusionsoftTokenController.getToken);

// Exchange refresh token for a new access token
router.get('/isrefresh', ensureLoggedIn, infusionsoftTokenController.refreshToken);

module.exports = router;
