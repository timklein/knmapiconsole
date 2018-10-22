const WealthEngineSDK = require('wealthengine-node-sdk');
// True flag sends requests to WE Sandbox rather than production.
// Pass False or delete parameter to direct requests to WE Production API
const WeAPI = new WealthEngineSDK(process.env.WEALTHENGINE_KEY, true);
const Result = require('../models/weData');

const controller = {

    test : function (req, res) {

        console.log(req.body);

        // Function to save returned results
        const saveResult = function (result) {
            let newResult = new Result ({
                id : req.body.id,
                integration : req.body.integration, 
                email : req.body.email,
                lastName : req.body.lastName,
                firstName : req.body.firstName,
                phone : req.body.phone,
                address1 : req.body.address1,
                address2 : req.body.address2,
                city : req.body.city,
                state : req.body.state,
                zip : req.body.zip,
                weData : result
            });
            newResult.save(function (err, result) {
                if(err) {return console.error(err);}
                console.log('WealthEngine Result Saved');
            });
        };

        
        //Create the request object
        let params = {
            integration: req.body.integration,
            id: req.body.id,
            email_address: req.body.email || '',
            last_name: req.body.lastName || '',
            first_name: req.body.firstName || '',
            address_line1: req.body.address1 || '',
            address_line2: req.body.address2 || '',
            city: req.body.city || '',
            state: req.body.state || '',
            zip: req.body.zip || '',
            mode : "full"
        }; 
        
        // Clean Phone# to just numeric digits or assign empty value
        if (req.body.phone) {
            params.phone = req.body.phone.replace(/\D/g,'');  
        }
        else {
            params.phone = '';
        }
        
        console.log(params);
        
        // Search for previously returned results in the database
        Result.findOne({ id : req.body.id, integration : req.body.integration}, function (err, result) {
            if(err){console.error(err);}
            
            // If results are found, return these and do not search WE
            if (result) {
                console.log(result);
                console.log('Results Returned from DB');
                res.sendStatus('200');
            }
            // If no results, then query WE as appropriate
            else {
    
                if (params.address_line1 && params.city && params.state && params.zip) {
        
                    //Look up a WealthEngine profile by address and [name]
                    WeAPI.getProfileByAddress(params, function(err, code, result){
                        if (err) console.error(err); 
                        saveResult(result);
                        console.log('Results by Address');
                        res.sendStatus('200');
                    }); 
                }
                else if (params.email_address) {
                    
                    //Look up a WealthEngine profile by email and [name]
                    WeAPI.getProfileByEmail(params, function(err, code, result){
                        if (err) console.error(err); 
                        saveResult(result);
                        console.log('Results by Email');
                        res.sendStatus('200');
                    });
                }
                else if (params.phone) {
        
                    //Look up a WealthEngine profile by phone number and [name]
                    WeAPI.getProfileByPhone(params, function(err, code, result){
                        if (err) console.error(err);
                        saveResult(result);
                        console.log('Results by Phone');
                        res.sendStatus('200');
                    });
                }
                else {
                    res.status('400').send('Bad Request: Not enough data sent to retrieve results');
                }
           }
        });
    }
}

module.exports = controller;
