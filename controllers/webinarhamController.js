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

const missingKey = (data) => {
	msg.text = 'Missing Required Key: ' +  JSON.stringify(data);
			msg.html = '<p><strong>Missing Required Key:</strong></p><p>' + JSON.stringify(data) + '</p>';
			sgMail.send(msg);

			console.log('Missing Required Key');
			console.log(data);
};

const controller = {

	getToken : function (req, res, next) {

		if (req.body.app_id && req.body.email) {
			Connection.findOne({ app_code : req.body.app_id }, 'access_token', function (err, token) {
				if (err) {
					console.log(err);
					res.status(500).send('Database Retrieval Error');
				}
				else if (token) {
					req.body.access_token = token.access_token;
					next();
				}
				else {
					msg.text = 'Invalid Application ID: ' +  JSON.stringify(req.body.app_id);
					msg.html = '<p><strong>Invalid Application ID</strong></p><p>' + JSON.stringify(req.body.app_id) + ' is not valid</p>';
					sgMail.send(msg);

					console.log('Invalid Application ID');
					console.log(req.body.app_id);
					res.status(404).send('Application ID ' + req.body.app_id + ' not found');
				}
			});
		}
		else {
			missingKey(req.body);
			res.status(400).send('Missing Required Key');
		}
	},
	getIds : function (req, res, next) {

		let contactOptions = {
			uri :  baseURL + '/contacts',
			qs : {
				access_token : req.body.access_token,
				email : req.body.email
			},
			json : true
		};

		let promise1 = new Promise((resolve, reject) => {
			
			rp(contactOptions)
			.then( function (contacts) {
				if (contacts.contacts.length) {
					let contact = contacts.contacts[0].id;
					req.body.contactID = contact;
					console.log('Contact ID ' + contact + ' found for email ' + req.body.email);
					resolve(req.body);
				}
				else {
					reject('No contact information found for ' + req.body.email);
				}
			})
			.catch( function (err) {
				console.log(err);
				console.log('Contact API Call Error');
				reject('Contact API Call Error');
			});
		});

		let promise2 = new Promise((resolve, reject) => {

			if (req.body.tag) {
				
				let tagOptions = {
					uri :  baseURL + '/tags',
					qs : {
						access_token : req.body.access_token
					},
					json : true
				};

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
					console.log('Tag API Call Failed');
					reject('Tag API Call Failed');
				});
			}
			else if (req.body.total_time) {

				let modelOptions = {
					uri :  baseURL + '/contacts/model',
					qs : {
						access_token : req.body.access_token
					},
					json : true
				};

				rp(modelOptions)
				.then( function (contactModel) {
					if (contactModel.custom_fields.length) {

						for (let index = 0; index < contactModel.custom_fields.length; index++) {	
							const field = contactModel.custom_fields[index];

							if (field.label === 'Webinar Total View Time') {
								req.body.fieldID = field.id
								console.log(req.body.fieldID);
								resolve(req.body);						
							}
						}
					}
					else {
						reject('No Custom Fields Found For ' + req.body.app_id);
					}
				})
				.catch( function (err) {
					console.log(err);
					console.log('Contact Model API Call Failed');
					reject('Contact Model API Call Failed');
				});
			}
			else {
				missingKey(req.body);
				reject('Missing Required Key');
			}
		});

		Promise.all([promise1, promise2])
		.then( values => {
			console.log(values);
			next();
		})
		.catch( reason => {
			console.log(reason);
			res.status(400).send(reason);
		});
	},
	addTag : function (req, res, next) {

		if (req.body.tagID) {
			
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
					next();
				}
			})
			.catch( function (err) {
				console.log(err);
				console.log('Tag Application Failed');
				res.sendStatus(200);
			});
		}
		else {
			console.log('No Tag Applied');
			next();
		}
	},
	updateTime : function (req, res) {
		
		if (req.body.total_time) {
			
			let contactOptions = {
				method : 'PATCH',
				uri :  baseURL + '/contacts/' + req.body.contactID,
				qs : {
					access_token : req.body.access_token
				},
				body : {
					custom_fields : [
						{
							content : req.body.total_time,
							id : req.body.fieldID
						}
					]
				},
				json : true
			};

			rp(contactOptions)
			.then( function (response) {
				
				if (response) {

					let msg = JSON.stringify(response);
					
					console.log('Custom Field Update Response: ' + msg);
					res.sendStatus(200);
				}
			})
			.catch( function (err) {
				console.log(err);
				console.log('Custom Field Update Failed');
				res.sendStatus(200);
			});

		}
		else {
			console.log('No View Time Submitted');
			res.sendStatus(200);
		}
	}
}

module.exports = controller;