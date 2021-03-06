const rp = require('request-promise-native');
const Contact = require('../models/callrailContacts');
const CallConfig = require('../models/callrailConfig');

const controller = {

    createContact : function (req, res) {

        if ( req.body.first_call ) {

            let newContact = new Contact ({
                id : req.body.id,
                company_name : req.body.company_name,
                business_phone_number : req.body.business_phone_number,
                formatted_business_phone_number : req.body.formatted_business_phone_number,
                customer_phone_number : req.body.customer_phone_number,
                formatted_customer_phone_number : req.body.formatted_customer_phone_number,
                first_call : req.body.first_call,
                tracking_phone_number : req.body.tracking_phone_number,
                formatted_tracking_phone_number : req.body.formatted_tracking_phone_number,
                source_name : req.body.source_name,
                formatted_tracking_source : req.body.formatted_tracking_source,
                utm_source : req.body.utm_source,
                utm_medium : req.body.utm_medium,
                utm_campaign : req.body.utm_campaign,
                callername : req.body.callername,
                callernum : req.body.callernum,
                trackingnum : req.body.trackingnum,
                created_at : req.body.created_at
            });
    
            newContact.save(function (err, contact) {
                if(err) {return console.error(err);}
                console.log('CallRail Contact Saved');
            });
        }
        else {
            console.log('Not First Call');
        }
        res.sendStatus(200);
    },
    identifyContact : function (contact) {
 
        console.log(contact);

    },
    createConfig : function (req, res) {

        let newConfig = new CallConfig ({
            company_name : req.query.companyName,
            app_code : req.query.appCode
        });
        
        newConfig.save( function (err, config) {
            if(err) {return console.error(err);}
            console.log('Config Saved');
            res.redirect('/callrail')
        });
    },
    configList : function (req, res, next) {
        CallConfig.find({}, function (err, configurations) {

            if (err) {
				res.send(err);
            }
            else if (configurations.length) {
                req.configurations = configurations
                next();
            }
            else {
                next();
            }
        });
    },
    sendSMS : function (req, res) {
        console.log(req.body);

        if (req.body.fromPhone && req.body.callrailCompanyID && req.body.toPhone && req.body.message && req.body.callrailAccountID && req.body.callrailAPIKey) {
            
            const options = {
                method: 'POST',
                uri: process.env.CALLRAIL_API_BASE_URL + '/' + req.body.callrailAccountID + '/text-messages.json',
                headers: {
                    'Authorization' : 'Token token=' + req.body.callrailAPIKey,
                    'User-Agent': 'Request-Promise'
                },
                body: {
                    company_id : req.body.callrailCompanyID,
                    tracking_number : req.body.fromPhone,
                    customer_phone_number : req.body.toPhone,
                    content : req.body.message
                },
                json: true // Automatically parses the JSON string in the response
            };

            rp(options)
            .then(function (parsedReply) {
                console.log(parsedReply);
                res.sendStatus(200);
            })
            .catch(function (err) {
                console.log(err.message);
                res.sendStatus(200);
            })
        }
        else {
            res.status(400).send('Bad Request: Missing Required Data Fields');
        }
    }
}

module.exports = controller;