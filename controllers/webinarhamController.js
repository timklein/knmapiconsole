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

// Helper function for handling missing keys
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
					console.log('Contact ID ' + contact + ' found for email ' + req.body.email + ' in application ' + req.body.app_id);
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

					// An array of objects is returned
					let tagsArray = tags.tags;

					// Filter the array to search for a tag that matches the request
					let result = tagsArray.filter( tag => req.body.tag === tag.name);

					// If there is a matching tag, proceed
					if (result.length) {
						// Get the tag id
						let tagID = result[0].id;
						// Add the tag id to the request body
						req.body.tagID = tagID;
						resolve(req.body);
					}
					// If there is no tag, fail
					else {
						reject('Tag "' + req.body.tag + '" does not exist in ' + req.body.app_id);
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

						// An array of custom field objects is returned
						let customFieldArray = contactModel.custom_fields;

						// Filter the array to search for the desired field label
						let result = customFieldArray.filter( field => field.label === 'Webinar Total View Time');

						// If there is a matching field, proceed
						if (result.length) {
							// Get the custom field id
							let fieldID = result[0].id;
							// Add the field id to the request body
							req.body.fieldID = fieldID;
							resolve(req.body);
						}
						// If there is no matching custom field, fail
						else {
							reject('The "Webinar Total View Time" custom field does not exist in ' + req.body.app_id);
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
			next();
		}
	},
	updateTime : function (req, res) {
		
		if (req.body.total_time && !req.body.tagID) {
			
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
		else if (req.body.tagID && req.body.total_time) {
			console.log('Tag & Time Submitted - Can not process both');
			res.sendStatus(200);
		}
		else {
			console.log('No View Time Submitted');
			res.sendStatus(200);
		}
	}
}

module.exports = controller;