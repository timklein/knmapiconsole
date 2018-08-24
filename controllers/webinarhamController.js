const rp = require('request-promise-native');
const Connection = require('../models/tokens');
const sgMail = require('@sendgrid/mail');

const baseURL = process.env.INFUSIONSOFT_API_BASE_URL;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
	to: process.env.SENDGRID_TO_EMAIL,
	from: process.env.SENDGRID_FROM_EMAIL,
	subject: 'KNMAPICONSOLE ERROR',
};

const controller = {

	getIds : function (req, res, next) {

		if (req.body.app_id && req.body.tag && req.body.email) {
			
			Connection.findOne({ app_code : req.body.app_id }, 'access_token', function (err, token) {
				if (err) {
					console.log(err);
				}
				else if (token) {

					req.body.access_token = token.access_token;
					
					let contactOptions = {
						uri :  baseURL + '/contacts',
						qs : {
							access_token : token.access_token,
							email : req.body.email
						},
						json : true
					};
		
					let tagOptions = {
						uri :  baseURL + '/tags',
						qs : {
							access_token : token.access_token
						},
						json : true
					};
			
					let promise1 = new Promise((resolve, reject) => {
		
						rp(contactOptions)
						.then( function (contacts) {
							
							if (contacts.contacts.length) {
								
								let contact = contacts.contacts[0].id;
								req.body.contactID = contact;
								resolve(req.body);
							
							}
						})
						.catch( function (err) {
							console.log(err);
							reject('Contact API Call Failed');
						});
					});
		
					let promise2 = new Promise((resolve, reject) => {
		
						rp(tagOptions)
						.then( function (tags) {
							for (let index = 0; index < tags.tags.length; index++) {
								
								let tag = tags.tags[index];
			
								if (req.body.tag === tag.name) {
									req.body.tagID = tag.id;
									resolve(req.body);
								}
							}
						})
						.catch( function (err) {
							console.log(err);
							reject('Tag API Call Failed');
						});
					});
		
					Promise.all([promise1, promise2])
					.then( values => {
						next();
					})
					.catch( reason => {
						console.log(reason);
						res.sendstatus(200);
					});
				}
				else {
					msg.text = 'Invalid Application ID: ' +  JSON.stringify(req.body.app_id);
					msg.html = '<p><strong>Invalid Application ID</strong></p><p>' + JSON.stringify(req.body.app_id) + ' is not valid</p>';
					sgMail.send(msg);

					console.log('Invalid Application ID');
					console.log(req.body.app_id);
					res.sendStatus(400);
				}
			});
		}
		else {
			msg.text = 'Missing Required Key: ' +  JSON.stringify(req.body);
			msg.html = '<p><strong>Missing Required Key:</strong></p><p>' + JSON.stringify(req.body) + '</p>';
			sgMail.send(msg);

			console.log('Missing Required Key');
			console.log(req.body);
			res.sendStatus(400);
		}
	},
	addTag : function (req, res) {

		let contactOptions = {
			method : 'POST',
			uri :  baseURL + '/contacts/' + req.body.contactID + '/tags',
			qs : {
				access_token : req.body.access_token
			},
			body : {
				tagIds : [req.body.tagID]
			},
			json : true
		};

		rp(contactOptions)
		.then( function (response) {
			
			if (response) {

				let msg = JSON.stringify(response);
				
				console.log('Tag Application Response: ' + msg);
				res.sendStatus(200);
			}
		})
		.catch( function (err) {
			console.log(err);
			console.log('Tag Application Failed');
			res.sendStatus(200);
		});
	}
}

module.exports = controller;