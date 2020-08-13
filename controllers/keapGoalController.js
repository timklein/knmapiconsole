const rp = require('request-promise-native');
const Token = require('../models/tokens');
const sgMail = require('@sendgrid/mail');

const baseURL = process.env.INFUSIONSOFT_API_BASE_URL;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
	to: process.env.SENDGRID_TO_EMAIL,
	from: process.env.SENDGRID_FROM_EMAIL,
	subject: 'KNMAPICONSOLE ERROR',
};

const controller = {

	getToken : function (req, res, next) {

		if (req.params.integration && req.params.callName) {
			Token.findOne({ app_code : req.params.integration }, 'access_token', function (err, token) {
				if (err) {
	                msg.text = 'Access Token Retrieval Error: ' +  req.params.integration;
					msg.html = '<p><strong>Access Token Retrieval From Database Generated an Error</strong></p><p>Database retrieval of access token for ' + req.params.integration + ' generated an error. Please check system logs for error details.</p>';
	                sgMail.send(msg);
	                
	                console.log(err);
					res.sendStatus(200);
				}
				else if (token) {
					req.body.access_token = token.access_token;
					next();
				}
				else {
					msg.text = 'Access Token Retrieval Error: ' +  req.params.integration;
					msg.html = '<p><strong>Access Token Retrieval From Database Resulted in an Unknown Error</strong></p><p>Database retrieval of access token for ' + req.params.integration + ' resulted in an unknown error.</p>';
	                sgMail.send(msg);

					console.log('Unknown Token Retrieval Error');
					console.log(req.params.integration);
					res.sendStatus(200);
				}
			});			
		}
		else {
            msg.text = 'Incoming Webhook Error: ' +  req.params.integration + ' is missing required data.';
			msg.html = '<p><strong>Incoming Webhook Error</strong></p><p>Incoming webhook from ' + req.params.integration + ' is missing required data.</p>';
            sgMail.send(msg);
            
            console.log('Integration: ' + req.params.integration);
            console.log('Call Name: ' + req.params.callName);
            console.log('Request Body ' + req.body);
            res.sendStatus(200);
		}
	},
	completeGoal : function (req, res) {

		if (req.body.object_keys[0].id) {
			
			let goalOptions = {
				method : 'POST',
				uri :  baseURL + '/campaigns/goals/' + req.params.integration + '/' + req.params.callName,
				qs : {
					access_token : req.body.access_token
				},
				body : {
					contact_id : req.body.object_keys[0].id
				},
				json : true
			};
	
			rp(goalOptions)
			.then( function (response) {
				
				if (response) {
	
					let msg = JSON.stringify(response);
					
					console.log('Goal Completion Response: ' + msg);
					res.sendStatus(200);
				}
			})
			.catch( function (err) {
                msg.text = 'API Error on Goal Completion';
			    msg.html = '<p><strong>API Error on Goal Completion</strong></p><p>API Call to ' + req.params.integration + ' generated an error for contact ID ' + JSON.stringify(req.body.object_keys[0].id) + ' when trying to complete goal ' + req.params.callName + '. Please review logs for error details.</p>';
                sgMail.send(msg);

				console.log(req.params.callName + ' goal completion failed in ' + req.params.integration + ' for contact ' + req.body.object_keys[0].id);
				console.log(err);
				res.sendStatus(200);
			});
		}
		else {
            console.log('Goal Completion Failed: No Contact ID Available');
			res.sendStatus(200);
		}
	}
}

module.exports = controller;