const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const dontenv = require('dotenv');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const flash = require('connect-flash');
const helmet = require('helmet');
const sgMail = require('@sendgrid/mail');

dontenv.load();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create and send initialization on application restart
const initializeMsg = {
	to: process.env.SENDGRID_TO_EMAIL,
	from: process.env.SENDGRID_FROM_EMAIL,
	subject: 'KNMAPICONSOLE RESTART',
	text: 'KNMApiConsole Application has restarted'
};

sgMail.send(initializeMsg);

const db = require('./models/db.js');
const agenda = require('./controllers/jobController');

const indexRouter = require('./routes/index');
const connectionRouter = require('./routes/connections');
const infusionsoftAuthRouter = require('./routes/infusionsoftAuth');
const whrouter = require('./routes/webinarham');
const callrailRouter = require('./routes/callrail');
const newsletterRouter = require('./routes/newsletter');
const weRouter = require('./routes/we');

// This will configure Passport to use Auth0
const strategy = new Auth0Strategy(
	{
		domain: process.env.AUTH0_DOMAIN,
		clientID: process.env.AUTH0_CLIENT_ID,
		clientSecret: process.env.AUTH0_CLIENT_SECRET,
		callbackURL: process.env.AUTH0_CALLBACK_URL
	},
	function(accessToken, refreshToken, extraParams, profile, done) {
		// accessToken is the token to call Auth0 API (not needed in the most cases)
		// extraParams.id_token has the JSON Web Token
		// profile has all the information from the user
		return done(null, profile);
	}
);

passport.use(strategy);

// you can use this section to keep a smaller payload
passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});

const app = express();

// Make environment variables available locally for Pug
app.locals.env = process.env;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware setup
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true
	})
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// Flash middleware for passport error handling
app.use(flash());

// Handle auth failure error messages
app.use(function(req, res, next) {
 if (req && req.query && req.query.error) {
	 req.flash("error", req.query.error);
 }
 if (req && req.query && req.query.error_description) {
	 req.flash("error_description", req.query.error_description);
 }
 next();
});

// Check logged in
app.use(function(req, res, next) {
	res.locals.loggedIn = false;
	if (req.session.passport && typeof req.session.passport.user != 'undefined') {
		res.locals.loggedIn = true;
	}
	next();
});

app.use('/', indexRouter);
app.use('/connections', connectionRouter);
app.use('/infusionsoftauth', infusionsoftAuthRouter);
app.use('/webinarham', whrouter);
app.use('/callrail', callrailRouter);
app.use('/newsletter', newsletterRouter);
app.use('/we', weRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
