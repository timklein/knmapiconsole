const WealthEngineSDK = require('wealthengine-node-sdk');
// True flag sends requests to WE Sandbox rather than production.
// Pass False or delete parameter to direct requests to WE Production API
const WeAPI = new WealthEngineSDK(process.env.WEALTHENGINE_KEY, true);

const controller = {

    test : function (req, res) {

        console.log(req.body);

        //Create the request object
        let params = {
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

        if (params.address_line1 && params.city && params.state && params.zip) {

            //Look up a WealthEngine profile by address and [name]
            WeAPI.getProfileByAddress(params, function(err, code, result){
                if (err) console.error(err); 
                console.dir(result);
                console.log('Results by Address');
                res.sendStatus('200');
            }); 
        }
        else if (params.email_address) {
            
            //Look up a WealthEngine profile by email and [name]
            WeAPI.getProfileByEmail(params, function(err, code, result){
                if (err) console.error(err); 
                console.dir(result);
                console.log('Results by Email');
                res.sendStatus('200');
            });
        }
        else if (params.phone) {

            //Look up a WealthEngine profile by phone number and [name]
            WeAPI.getProfileByPhone(params, function(err, code, result){
                if (err) console.error(err);
                console.dir(result);
                console.log('Results by Phone');
                res.sendStatus('200');
            });
        }
        else {
            res.status('400').send('Bad Request: Not enough data sent to retrieve results');
        }
    }
}

module.exports = controller;
