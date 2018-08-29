const rp = require('request-promise-native');
const Contact = require('../models/callrailContacts');

const controller = {

    createContact : function (req, res) {

        if ( ! req.body.first_call ) {

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
    
                console.log('Contact Saved');
            });
        }
    
        res.sendStatus(200);

    },
    identifyContact : function (req, res) {
        
        let days = 7; // How many days back?
        let conv = 86400000; // Conversion factor days to milliseconds
        let startDate = new Date(Date.now() - (days * conv));
        let endDate = new Date(Date.now() - ((days - 1) * conv));
        
        console.log(new Date());
        console.log(startDate);
        console.log(endDate);
    
    }
}

module.exports = controller;