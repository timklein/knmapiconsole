const Agenda = require('agenda');
const db = require('../models/db');
const tokens = require('../models/tokens');
const Newsletters = require('../models/newsletterConfig');
const Contacts = require('../models/callrailContacts');
const request = require('request');
const callrail = require('./callrailController');
const Parser = require('rss-parser');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const agenda = new Agenda({ mongo : db });
const parser = new Parser();

console.log('Starting Agenda');

agenda.define('Refresh Token', job => {

	const msg = {
		to: process.env.SENDGRID_TO_EMAIL,
		from: process.env.SENDGRID_FROM_EMAIL,
		subject: 'KNMAPICONSOLE ERROR: Refresh Token Error in jobController',
	};

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

				if (err) {
					return console.error(err);
				}
				else if (JSON.parse(body).error) {
					msg.text = 'Token Refresh for ' + connection_name + ' failed';
                    msg.html = '<p><strong>Token Refresh for ' + connection_name + ' failed</strong></p><p>Please check system logs for error details.</p>';
					sgMail.send(msg);
					console.log('Token refresh error response for ' + connection_name + ': ' + resp.body);
				}
				else if (JSON.parse(body).access_token) {
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
	
						tokens.replaceOne({ _id : id }, newToken, {overwrite : true}, function (err, raw) {
							
							if(err) {return console.error(err);}
							
						});
					}
					else {

						msg.text = 'Error Creating New Token Record for ' + connection_name;
                    	msg.html = '<p><strong>Error Creating New Token Record for ' + connection_name + '</strong></p><p>Please check system logs for error details.</p>';
						sgMail.send(msg);
						console.log('Token record creation error response for ' + connection_name + ': ' + resp.body);
					}
				}
				else {

					msg.text = 'Unknown token refresh error for ' + connection_name;
                    msg.html = '<p><strong>Unknown token refresh error for ' + connection_name + '</strong></p><p>Please check system logs for error details.</p>';
					sgMail.send(msg);
					console.log('Unknown token refresh error for ' + connection_name + ': ' + resp);
				}
			});
        });
    });
});

agenda.define('Identify Contacts', job => {
	
	let days = 1; // How many days back?
	let conv = 86400000; // Conversion factor days to milliseconds
	let startDate = new Date(Date.now() - (days * conv));
	let endDate = new Date(Date.now() - ((days - 1) * conv));
	
	console.log(new Date());
	console.log(startDate);
	console.log(endDate);

	// Find contacts to identify
	Contacts.find({ 'created_at' : { '$gte' : startDate.toISOString(), '$lt' : endDate.toISOString() }}, (err, contacts) => {

		if (err) {
			console.log(err);
		}

		let i = 0;
		let records = contacts.length;

		console.log(records);

		// Send each contact over to callrailController to submit to API
		contacts.map(contact => callrail.identifyContact(contact));

		// Recursive function to call each item returned by query
		function call() {
			callrail.identifyContact(contacts[i]);
			i++
			if (i < records) {
				setTimeout( call , 1000);
			}			
		}

		// if (records > 0) {
		// 	call();
		// }

	});

});

agenda.define('Weekly Newsletter', job => {

	// Get all of the Newsletter Configurations
	Newsletters.find({}, function(err, newsletterArray) {

		// For each configuration, get the token and send a request for the associated feed
		newsletterArray.forEach(newsletter => {
			
			tokens.findOne({'app_code' : newsletter.app_code}, function (err, token) {

				(async () => {
					
					let feed = await parser.parseURL(newsletter.feed_url);
					let contactsList = [];

					const msg = {
					  subject: 'Your Weekly Blog Update from ' + feed.title,
					  html: '<div style="text-align: center;"><a href="http://regenexx.com"><img src="https://momentumtelecom.com/wp-content/uploads/Regenexx-logo-1-e1534191936522.png" width="500px" align="center"></a><br /><h1 style="color: grey;">This Week\'s Blog Posts from Regenexx</h1><h2 style="color: #0b1423d9;">The latest articles, outcomes, news and commentary on regenerative orthopedic medicine.</h2></div><hr />'
					};
					
					for (let index = 0; index < 5; index++) {
					  
					  const element = feed.items[index];
					  
					  msg.html += '<h3 style="margin-top: 10px;"><a href="' + element.link + '">' + element.title + '</a></h3><p>' + element.content + '</p><hr />'
					  
					}

					// Base64 encode the html content for the email
					let encodedString = Buffer.from(msg.html).toString('base64');

					// Get list of tagged contacts to receive newsletter
					request ({
						method : 'GET',
						url : process.env.INFUSIONSOFT_API_BASE_URL + "/tags/" + newsletter.tag_id + "/contacts",
						qs : { access_token : token.access_token},
						json : true,
					}, function(err, resp, body) {

						if (err) {
							return console.error('error: ' + err);
						}
						
						for (let index = 0; index < body.contacts.length; index++) {
							const element = body.contacts[index];
							contactsList.push(element.contact.id);
						}
						
						console.log(body.contacts.length + ' Newletter Tagged Contacts for ' + newsletter.app_code);
						console.log(contactsList);

						request ({
							method : 'POST',
							url : process.env.INFUSIONSOFT_API_BASE_URL + "/emails/queue",
							qs : { access_token : token.access_token},
							json : true,
							body : {
								"contacts" : contactsList,
								"html_content" : encodedString,
								"subject" : msg.subject,
								"user_id" : newsletter.from_id
							}
						}, function(err, resp, body) {
						
							console.log('Newsletter Response Status Code for ' + newsletter.app_code + ': ' + resp.statusCode);

							if (err) {
								return console.error('error: ' + err);
							}
							else if (body) {
								console.log('body: ' + body);
							}
						});
					});
					
				})();
			});
		});
	});
});

agenda.define('Corporate Client List Update', job => {

	console.log('Begin Client List Update Process');
	
	request({
		method: 'GET',
		url: process.env.BASE_URL + 'hooks/clientList',
		headers: {'Content-Type' : 'application/x-www-form-urlencoded'},
		form: {
			knmapikey: process.env.KNM_API_KEY
		}
	}), function(err, resp, body) {
		if(err) {
			console.log(err);
		}
		else if (resp) {
			console.log('Client List Update Process Complete');
		}
	};
});

(async function() {
    
    await agenda.start();

    await agenda.every('30 minutes', 'Refresh Token');
    await agenda.every('1 week', 'Weekly Newsletter');
	// await agenda.every('30 seconds', 'Identify Contacts');
    await agenda.every('1 day', 'Corporate Client List Update');

})();