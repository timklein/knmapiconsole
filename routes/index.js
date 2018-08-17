const express = require('express');
const passport = require('passport');
const router = express.Router();

// GET home page - redirect to login
router.get('/', function(req, res, next) {
	res.redirect('/login');
});

// GET login page - Authorization through auth0.com
router.get('/login', passport.authenticate('auth0', {scope: 'openid email profile'}));

// GET logout - Process logout and redirect home
router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

// GET route for authorization callback URL
router.get('/callback', passport.authenticate('auth0', {failureRedirect: '/failure'}), function(req, res) {
	res.redirect(req.session.returnTo || '/user');
});

// GET route for failed logins from Auth0
router.get('/failure', function(req, res) {
	let error = req.flash("error");
	let error_description = req.flash("error_description");
	req.logout();
	res.render('failure', {
		error: error[0],
		error_description: error_description[0],
	});
});

module.exports = router;
