const Agenda = require('agenda');
const db = require('../models/db');
const tokens = require('../models/tokens');
const request = require('request');

const agenda = new Agenda({ mongo : db });

console.log('Starting Agenda');

agenda.define('Refresh Token', job => {

	// Set searchDate to look for tokens within 3 hours of expiring
	let searchDate = Date.now() + (3*60*60*1000);

    tokens.find({ expires_at : { $lt : searchDate } }, function (err, tokenArray) {
       
        tokenArray.forEach( token => {

            //Get the refresh token from this record
            let tokenString = token.refresh_token;
            
			// Get the record constants 
			let id = token._id;
            let connection_name = token.connection_name;

			// Base64 encode Infusionsoft application credentials
			const encodedCredientials = Buffer.from(process.env.INFUSIONSOFT_CLIENT_ID + ":" + process.env.INFUSIONSOFT_CLIENT_SECRET).toString('base64');

			// Build request URL
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

				if (err) { return console.error(err); }

				// Calculate new token expiration from "expires_in" value (multiply by 1000 to convert to milliseconds)
				let newExpiration = new Date(Date.now() + (JSON.parse(body).expires_in * 1000));

				let newToken = {
					connection_name : connection_name,
					app_code : JSON.parse(body).scope.split("|")[1].substr(0,5),
					access_token : JSON.parse(body).access_token,
					token_type : JSON.parse(body).token_type,
					expires_in : JSON.parse(body).expires_in,
					refresh_token : JSON.parse(body).refresh_token,
					scope : JSON.parse(body).scope,
					expires_at : newExpiration
				};

				if (newToken.access_token) {

					tokens.update({ _id : id }, newToken, {overwrite : true}, function (err, raw) {
						
						if(err) {return console.error(err);}
						
						// console.log(raw);
						
					});
				}
				else {
					console.log('Access Token Field Blank');
				}
			});
        });
    });
});

(async function() {
    
    await agenda.start();

    await agenda.every('30 minutes', 'Refresh Token');

})();