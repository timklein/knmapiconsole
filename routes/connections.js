// Main user console page
const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
const Connection = require('../models/tokens');
const router = express.Router();

// Build page for user console
router.get('/', ensureLoggedIn, function(req, res, next) {

	// Find all existing API connections
	Connection.find({}, function(err, tokens) {

		if (err) {
				res.send(err);
		} 
		else if (tokens.length) {
		    res.render('connections', {
		        tokens : tokens,
		        user : req.user
			});
		}
		else {
			res.render('connections', {
				user : req.user
			});
		}

	}).sort({ 'expires_at' : 1 });
});

module.exports = router;
