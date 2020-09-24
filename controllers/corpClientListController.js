const request = require('request');
const Token = require('../models/tokens');
const sgMail = require('@sendgrid/mail');

const baseXMLURL = process.env.INFUSIONSOFT_XML_API_BASE_URL;
const baseRESTURL = process.env.INFUSIONSOFT_API_BASE_URL;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
	to: process.env.SENDGRID_TO_EMAIL,
	from: process.env.SENDGRID_FROM_EMAIL,
	subject: 'KNMAPICONSOLE ERROR: XML API',
};

const controller = {

    // Get the API access token for the Master Corporate Client List
    getToken : function (req, res, next) {

        Token.findOne({ app_code : process.env.CLIENT_LIST_SOURCE }, 'access_token', function (err, token) {
            if (err) {
                msg.text = 'FUNCTION getToken in corpClientController.js generated an error for or106 - Regenexx';
                msg.html = '<p><strong>Access Token Retrieval From Database Failed</strong></p><p>Database retrieval of access token for Corporate Client Name Retrieval process was unsuccessful. Please check system logs for error details.</p>';
                sgMail.send(msg);
                
                console.log(err);
                res.sendStatus(200);
            }
            else if (token) {
                req.body.access_token = token.access_token;
                next();
            }
            else {
                msg.text = 'FUNCTION getToken in corpClientController.js generated an error for or106 - Regenexx';
                msg.html = '<p><strong>Access Token Retrieval From Database Resulted in an Unknown Error</strong></p><p>Database retrieval of access token for Corporate Client Name Retrieval process was unsuccessful. Please check system logs for error details.</p>';
                sgMail.send(msg);

                console.log('Unknown Token Retrieval Error in FUNCTION getToken in corpClientListController.js');
                res.sendStatus(200);
            }
        });			
    },
    // Retrieve the Master Corporate Client List
    retrieveList : function (req, res, next) {

        // console.log(req.body.access_token);

        request ({
            method: 'POST',
            url: baseXMLURL + "?access_token=" + req.body.access_token,
            headers: {'Content-Type' : 'application/xml'},
            body : '<?xml version="1.0" encoding="UTF-8"?><methodCall><methodName>DataService.load</methodName><params><param><value><string>privateKey</string></value></param><param><value><string>DataFormField</string></value></param><param><value><int>' + process.env.CLIENT_LIST_CUSTOM_FIELD_ID + '</int></value></param><param><value><array><data><value><string>Label</string></value><value><string>Values</string></value></data></array></value></param></params></methodCall>'
        }, function (err, resp, body) {

            if (err) {
                msg.text = 'FUNCTION retrieveList in corpClientController.js generated an error for ' + process.env.CLIENT_LIST_SOURCE;
                msg.html = '<p><strong>Client List Retrieval From API Failed</strong></p><p>API retrieval of client list for Corporate Client Name Retrieval process was unsuccessful. Please check system logs for error details.</p>';
                sgMail.send(msg);

                console.log(err);
                res.sendStatus(200);
            }
            else if (body.includes('faultCode')) {
                msg.text = 'FUNCTION retrieveList in corpClientController.js generated an API fault for ' + process.env.CLIENT_LIST_SOURCE;
                msg.html = '<p><strong>Client List Retrieval From API Failed</strong></p><p>API retrieval of client list for Corporate Client Name Retrieval process was unsuccessful. Please check system logs for error details.</p>';
                sgMail.send(msg);

                console.log('Fault: ' + resp.body);
                res.sendStatus(200);
            }
            else {

                let regex = /Values<\/name><value>([\s\S]*?)<\/value><\/member>/;
                let parsedBody = resp.body.split(regex);

                req.body.clientList = parsedBody[1];
                next();
            }
        });
    },
    // Update all affiliate accounts that have the correct custom field with the Master Corporate Client List
    updateAffiliates : function (req, res) {

        // Find API access tokens all accounts in the database except for the Master List account
        Token.find({ app_code : { $ne : process.env.CLIENT_LIST_SOURCE } }, function (err, token) {

            token.forEach(affiliate => {

                let params = {
                    app_code : affiliate.app_code,
                    access_token : affiliate.access_token
                };

                // Check the contact model for each account to see if the correct cutom field is available
                request({
                    method: 'GET',
                    url: baseRESTURL + '/contacts/model',
                    headers: { Authorization : 'Bearer ' + affiliate.access_token}
                }, function (err, resp, body) {

                    if (err) {
                        msg.text = 'FUNCTION updateAffiliates in corpClientController.js generated an error for ' + params.app_code;
                        msg.html = '<p><strong>Contact Model not retrieved in application ' + params.app_code + '</strong></p><p>contact model retrieval for Corporate Client Name update process was unsuccessful. Please check system logs for error details.</p>';
                        sgMail.send(msg);
                        
                        console.log(err);
                    }
                    else if (body.includes('faultCode')) {
                        msg.text = 'FUNCTION updateAffiliates in corpClientController.js generated an API fault code in application ' + params.app_code;
                        msg.html = '<p><strong>Contact Model not retrieved in application ' + params.app_code + '</strong></p><p>API retrieval of contact model for Corporate Client Name update process generated a fault code. Please check system logs for error details.</p>';
                        sgMail.send(msg);

                        console.log('Fault: ' + resp.body);
                    }
                    else if (body.includes('custom_fields')) {
                        const customFields = JSON.parse(resp.body).custom_fields;
                        const foundField = customFields.find(element => element.label == 'Corporate Client Name__');
                        
                        // If the correect custom field exists get the ID for the field and update the field with the Master list
                        if (foundField) {
                            request({
                                method: 'POST',
                                url: baseXMLURL + "?access_token=" + params.access_token,
                                headers	: {'Content-Type' : 'application/xml'},
                                body: '<?xml version="1.0" encoding="UTF-8"?><methodCall><methodName>DataService.updateCustomField</methodName><params><param><value><string>privateKey</string></value></param><param><value><int>' + foundField.id + '</int></value></param><param><value><struct><member><name>Values</name><value><string>' + req.body.clientList + '</string></value></member></struct></value></param></params></methodCall>'
                            }, function (err, resp, body) {
                                if (err) {
                                    msg.text = 'FUNCTION updateAffiliates in corpClientController.js generated an error for ' + params.app_code;
                                    msg.html = '<p><strong>Client List not updated in application ' + params.app_code + '</strong></p><p>API update of client list for Corporate Client Name Retrieval process was unsuccessful. Please check system logs for error details.</p>';
                                    sgMail.send(msg);

                                    console.log(err);
                                }
                                else if (body.includes('faultCode')) {
                                    msg.text = 'FUNCTION updateAffiliates in corpClientController.js generated an error for ' + params.app_code;
                                    msg.html = '<p><strong>Client List not updated in application ' + params.app_code + '</strong></p><p>API update of client list for Corporate Client Name Retrieval process generated a fault code. Please check system logs for error details.</p>';
                                    sgMail.send(msg);

                                    console.log('Fault: ' + resp.body);
                                }
                                else {
                                    let regex = /<boolean>([\s\S]*?)<\/boolean>/;
                                    let parsedBody = resp.body.split(regex);

                                    if (parsedBody[1] == 1) {
                                        console.log('Client List updated in application ' + params.app_code);
                                    }
                                    else {
                                        console.log('Unknown Response: ' + body);
                                    }
                                }
                            });
                        }
                    }
                    else {
                        console.log('Application ' + params.app_code + ' is unavailable or contains no custom fields');
                    }
                });
            });
        });

        res.sendStatus(200);

    }
}

module.exports = controller;
