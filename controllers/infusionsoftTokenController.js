const request = require('request');
const Connection = require('../models/tokens');

const credentials = {
	client: {
		id: process.env.INFUSIONSOFT_CLIENT_ID,
		secret: process.env.INFUSIONSOFT_CLIENT_SECRET
	},
	auth: {
		authorizeHost: process.env.INFUSIONSOFT_AUTH_HOST,
		authorizePath: process.env.INFUSIONSOFT_AUTH_PATH,
		tokenHost: process.env.INFUSIONSOFT_TOKEN_HOST,
		tokenPath: process.env.INFUSIONSOFT_TOKEN_PATH
	}
};
   
// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(credentials);


const controller = {
	
	// Direct to Infusionsoft Oauth2 Authorization URL
	authorize : (req, res) => {

		// Build authorization URI with key parameters needed saved in "state" to allow them to pass through to final callback
		const authorizationUri = oauth2.authorizationCode.authorizeURL({
			redirect_uri: process.env.INFUSIONSOFT_REDIRECT_URI,
			state: JSON.stringify(req.query)
		});

		res.redirect(authorizationUri);
	},

	getToken : async (req, res) => {

		// Constants needed to convert mangled state string that's passed back from initial request
		const strg = req.query.state
		const regex = /&quot;/gi;


		// Incoming authorization code needed to request oauth token
		const authCode = req.query.code;
		// Fix and convert returned state data passed from initial request into JSON
		const state = JSON.parse(strg.replace(regex, '"'));
		
		const options = {
			code: authCode,
			redirect_uri: process.env.INFUSIONSOFT_REDIRECT_URI
		};
		
		try {
			
			const result = await oauth2.authorizationCode.getToken(options);
			const token = oauth2.accessToken.create(result);

			let connection = new Connection ({
				connection_name : state.connectionName,
				app_code : token.token.scope.split("|")[1].substr(0,5),
				access_token : token.token.access_token,
				token_type : token.token.token_type,
				expires_in : token.token.expires_in,
				refresh_token : token.token.refresh_token,
				scope : token.token.scope,
				expires_at : token.token.expires_at
			});

			connection.save((err, connection) => {
				if (err) {
					console.log(err);
				}
				return res.redirect('/connections')
			});

		} catch(error) {
			console.error('Access Token Error', error);
			return res.status(500).json('Authentication failed');
		}
	},

	refreshToken : function (req, res) {

		// Find record by id passed from connection list
		Connection.findById( req.query.id, 'refresh_token', function (err, token) {

			//Get the refresh token from this record
			let tokenString = token.refresh_token;

			let id = token._id;

			// Base64 encode Infusionsoft application credentials
			const encodedCredientials = Buffer.from(process.env.INFUSIONSOFT_CLIENT_ID + ":" + process.env.INFUSIONSOFT_CLIENT_SECRET).toString('base64');

			const requestUrl = process.env.INFUSIONSOFT_TOKEN_HOST + process.env.INFUSIONSOFT_TOKEN_PATH

			request ({
				method : 'POST',
				url : requestUrl,
				headers : {
					'Content-Type' : 'application/x-www-form-urlencoded',
					'Authorization' : 'Basic ' + encodedCredientials
				},
				form : {
					"grant_type" : "refresh_token",
					"refresh_token" : tokenString
				}
			}, function(err, resp, body) {

				// Calculate new token expiration from "expires_in" value (multiply by 1000 to convert to milliseconds)
				let newExpiration = new Date(Date.now() + (JSON.parse(body).expires_in * 1000));

				let newToken = {
					connection_name : req.query.name,
					app_code : JSON.parse(body).scope.split("|")[1].substr(0,5),
					access_token : JSON.parse(body).access_token,
					token_type : JSON.parse(body).token_type,
					expires_in : JSON.parse(body).expires_in,
					refresh_token : JSON.parse(body).refresh_token,
					scope : JSON.parse(body).scope,
					expires_at : newExpiration
				};

				if (newToken.access_token) {

					Connection.update({ _id : id }, newToken, {overwrite : true}, function (err, raw) {
						
						if(err) {return console.error(err);}
						
						// console.log(raw);
						
					});
				}

				res.redirect('/connections')
			
			});
		});
	},
	buildList : function (req, res, next) {
		// Find connections to build CallRail connections dropdown list
		Connection.find().sort({ connection_name : 1 }).exec((err, res) => {
			req.apps = res;
			next();
		});
	}
}

module.exports = controller;
