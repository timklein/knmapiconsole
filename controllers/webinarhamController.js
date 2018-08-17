// const request = require('request');
const rp = require('request-promise-native');
const Connection = require('../models/tokens');

const baseURL = process.env.INFUSIONSOFT_API_BASE_URL

const controller = {

	getIds : function (req, res, next) {

		let token = Connection.findOne({ app_code : req.body.app_code }, 'access_token', function (err, token) {
			
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
		});
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