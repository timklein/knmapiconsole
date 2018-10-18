const WealthEngineSDK = require('wealthengine-node-sdk');
// True flag sends requests to WE Sandbox rather than production.
// Pass False or delete parameter to direct requests to WE Production API
const WeAPI = new WealthEngineSDK(process.env.WEALTHENGINE_KEY, true);


const controller = {

    test : function (req, res) {

        console.log(req.body);
        
        //Create the request object
        let params = {
            email_address: req.body.email, 
            // first_name: "HAMBURT", 
            // last_name: "PORKINGTON"
        }; 
        
        //Look up a WealthEngine profile by email and [name]
        WeAPI.getProfileByEmail(params, function(err, code, result){
            if (err) console.error(err); 
            res.send(result); 
        });
    }
}

module.exports = controller;
