const WealthEngineSDK = require('wealthengine-node-sdk');
// True flag sends requests to WE Sandbox rather than production.
// Pass False or delete parameter to direct requests to WE Production API
const WeAPI = new WealthEngineSDK(process.env.WEALTHENGINE_KEY, false);
const rp = require('request-promise-native');
const sgMail = require('@sendgrid/mail');

const baseURL = process.env.INFUSIONSOFT_API_BASE_URL;

const Result = require('../models/weData');
const Token = require('../models/tokens');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
	to: process.env.SENDGRID_TO_EMAIL,
	from: process.env.SENDGRID_FROM_EMAIL,
	subject: 'KNMAPICONSOLE ERROR',
};

const controller = {

    retrieveData : function (req, res, next) {

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
            // zip: req.body.zip.substr(0, 5) || '',
            mode : "full"
        }; 
        
        // Clean Phone# to just numeric digits or assign empty value
        if (req.body.phone ) {
            params.phone = req.body.phone.replace(/\D/g,'');  
        }
        else {
            params.phone = '';
        }

        // If zipcode contains a letter (Canadian zipcode), set to blank
        // else set to 5 digit zipcode
        let zipRegex = RegExp(/[^0-9]/g);
        if (zipRegex.test(req.body.zip.substr(0, 5))) {
            params.zip = '';
        } 
        else {
            params.zip = req.body.zip.substr(0, 5);
        }
        
        console.log(params);
        
        // Search for previously returned results in the database
        Result.findOne({ id : req.body.id, integration : req.body.integration}, function (err, result) {
            if(err){console.error(err);}
            
            // If results are found, return these and do not search WE
            if (result) {
                // req.body.weScore = result.weData.wealth.networth.value;
                req.body.weAge = result.weData.identity.age || '';
                req.body.weGender = ( 'gender' in result.weData.identity ) ? result.weData.identity.gender.text || '' : '';
                req.body.weMarital = ( 'marital_status' in result.weData.identity ) ? result.weData.identity.marital_status.text || '' : '';
                req.body.weCash = ( 'cash_on_hand' in result.weData.wealth ) ? result.weData.wealth.cash_on_hand.text || '' : '';
                req.body.weWorth = ( 'networth' in result.weData.wealth ) ? result.weData.wealth.networth.text || '' : '';
                req.body.weAssets = ( 'total_assets' in result.weData.wealth ) ? result.weData.wealth.total_assets.text || '' : '';
                req.body.weIncome = ( 'total_income' in result.weData.wealth ) ? result.weData.wealth.total_income.text || '' : '';
                console.log('Results Returned from DB');
                next();
            }
            // If no results, then query WE as appropriate
            else {
    
                if (params.address_line1 && params.city && params.state && params.zip) {
        
                    //Look up a WealthEngine profile by address and [name]
                    WeAPI.getProfileByAddress(params, function(err, code, result){
                        if (err) console.error(err); 
                        if (code == 555) {
                            console.log('Status ' + code + ': No Results Returned');
                            res.sendStatus('200');
                        }
                        else {
                            saveResult(result);
                            // req.body.weScore = result.wealth.networth.value;
                            req.body.weAge = result.identity.age || '';
                            req.body.weGender = ( 'gender' in result.identity ) ? result.identity.gender.text || '' : '';
                            req.body.weMarital = ('marital_status' in result.identity) ? result.identity.marital_status.text || '' : ''; 
                            req.body.weCash = ('cash_on_hand' in result.wealth) ? result.wealth.cash_on_hand.text || '' : '';
                            req.body.weWorth = ('networth' in result.wealth) ? result.wealth.networth.text || '' : '';
                            req.body.weAssets = ('total_assets' in result.wealth) ? result.wealth.total_assets.text || '' : '';
                            req.body.weIncome = ('total_income' in result.wealth) ? result.wealth.total_income.text || '' : '';
                            console.log('Results by Address');
                            next();
                        }
                    }); 
                }
                else if (params.email_address) {
                    
                    //Look up a WealthEngine profile by email and [name]
                    WeAPI.getProfileByEmail(params, function(err, code, result){
                        if (err) console.error(err); 
                        if (code == 555) {
                            console.log('Status ' + code + ': No Results Returned');
                            res.sendStatus('200');
                        }
                        else {
                            saveResult(result);
                            // req.body.weScore = result.wealth.networth.value;
                            req.body.weAge = result.identity.age || '';
                            req.body.weGender = ( 'gender' in result.identity ) ? result.identity.gender.text || '' : '';
                            req.body.weMarital = ('marital_status' in result.identity) ? result.identity.marital_status.text || '' : ''; 
                            req.body.weCash = ('cash_on_hand' in result.wealth) ? result.wealth.cash_on_hand.text || '' : '';
                            req.body.weWorth = ('networth' in result.wealth) ? result.wealth.networth.text || '' : '';
                            req.body.weAssets = ('total_assets' in result.wealth) ? result.wealth.total_assets.text || '' : '';
                            req.body.weIncome = ('total_income' in result.wealth) ? result.wealth.total_income.text || '' : '';
                            console.log('Results by Email');
                            next();
                        }
                    });
                }
                else if (params.phone) {
        
                    //Look up a WealthEngine profile by phone number and [name]
                    WeAPI.getProfileByPhone(params, function(err, code, result){
                        if (err) console.error(err);
                        if (code == 555) {
                            console.log('Status ' + code + ': No Results Returned');
                            res.sendStatus('200');
                        }
                        else {
                            saveResult(result);
                            // req.body.weScore = result.wealth.networth.value;
                            req.body.weAge = result.identity.age || '';
                            req.body.weGender = ( 'gender' in result.identity ) ? result.identity.gender.text || '' : '';
                            req.body.weMarital = ('marital_status' in result.identity) ? result.identity.marital_status.text || '' : ''; 
                            req.body.weCash = ('cash_on_hand' in result.wealth) ? result.wealth.cash_on_hand.text || '' : '';
                            req.body.weWorth = ('networth' in result.wealth) ? result.wealth.networth.text || '' : '';
                            req.body.weAssets = ('total_assets' in result.wealth) ? result.wealth.total_assets.text || '' : '';
                            req.body.weIncome = ('total_income' in result.wealth) ? result.wealth.total_income.text || '' : '';
                            console.log('Results by Phone');
                            next();
                        }
                    });
                }
                else {
                    res.status('400').send('Bad Request: Not enough data sent to retrieve results');
                }
           }
        });
    },
    update : function (req, res, next) {

        Token.findOne({app_code : req.body.integration}, 'access_token', function (err, token) {
            
            if(err){console.error(err);}
            
            if (token) {
                
                req.body.access_token = token.access_token;

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

                        // An array of field labels to look for
                        let labels = ['Age', 'Gender', 'Marital Status', 'Cash on Hand', 'Net Worth', 'Total Assets', 'Total Income'];

                        // An array of custom field objects is returned
                        let customFieldArray = contactModel.custom_fields;

						// Filter the array to search for the desired field labels
                        let result = customFieldArray.filter( field => labels.includes(field.label));
                        
                        console.log(result);

                        // Sort function
                        function compare(a, b) {
                            const labelA = a.label.toUpperCase();
                            const labelB = b.label.toUpperCase();

                            let comparison = 0;

                            if (labelA > labelB) {
                                comparison = 1;                                
                            }
                            else if (labelA < labelB) {
                                comparison = -1;                                
                            }

                            return comparison;
                        };

                        result.sort(compare);

                        console.log(result);
                        
                        // If there are matching fields, proceed
						if (result.length) {
							// Get the custom field id
							// let fieldID = result[0].id;
							// Add the field ids to the request body
                            req.body.ageFieldID = result[0].id || '';
                            req.body.cashFieldID = result[1].id || '';
                            req.body.genderFieldID = result[2].id || '';
                            req.body.maritalFieldID = result[3].id || '';
                            req.body.worthFieldID = result[4].id || '';
                            req.body.assetsFieldID = result[5].id || '';
                            req.body.incomeFieldID = result[6].id || '';
                            console.log(req.body);
                            next();
                            // res.sendStatus(200);
                        }
						// If there is no matching custom field, fail
						else {
                            msg.text = 'The "WE NetWorth Score" custom field does not exist in ' +  JSON.stringify(req.body.integration);
				            msg.html = '<p><strong>Invalid Custom Field</strong></p><p>"WE NetWorth Score" is not configured in application ' + JSON.stringify(req.body.integration) + '</p>';
				            sgMail.send(msg);
                            
                            console.log('The "WE NetWorth Score" custom field does not exist in ' + req.body.integration);
                            res.sendStatus('200');
						}
                    }
                    else {
                        msg.text = 'No custom fields found in ' +  JSON.stringify(req.body.integration);
				        msg.html = '<p><strong>Invalid Custom Field</strong></p><p>No custom fields found in application ' + JSON.stringify(req.body.integration) + '</p>';
                        sgMail.send(msg);
                        
                        console.log('No Custom Fields Found For ' + req.body.integration);
                        res.sendStatus(200);
                    }
                })
                .catch( function (err) {
					console.log(err);
					console.log('Contact Model API Call Failed');
					res.sendStatus(200);
				});
            }
            else {
                msg.text = 'Invalid Application ID: ' +  JSON.stringify(req.body.integration);
				msg.html = '<p><strong>Invalid Application ID</strong></p><p>' + JSON.stringify(req.body.integration) + ' is not configured in KNMAPIConsole</p>';
                sgMail.send(msg);
                
                console.log('No Access Token for Integration ' + req.body.integration);
                res.sendStatus('200');
            }
        });
    },
    updateScore : function (req, res) {

        let contactOptions = {
            method : 'PATCH',
            uri :  baseURL + '/contacts/' + req.body.id,
            qs : {
                access_token : req.body.access_token
            },
            body : {
                custom_fields : [
                    {
                        content : req.body.weAge,
                        id : req.body.ageFieldID
                    },
                    {
                        content : req.body.weGender,
                        id : req.body.genderFieldID
                    },
                    {
                        content : req.body.weMarital,
                        id : req.body.maritalFieldID
                    },
                    {
                        content : req.body.weCash,
                        id : req.body.cashFieldID
                    },
                    {
                        content : req.body.weWorth,
                        id : req.body.worthFieldID
                    },
                    {
                        content : req.body.weAssets,
                        id : req.body.assetsFieldID
                    },
                    {
                        content : req.body.weIncome,
                        id : req.body.incomeFieldID
                    }
                ]
            },
            json : true
        };

        rp(contactOptions)
        .then( function (response) {

            if (response) {
                
                let message = JSON.stringify(response);

                console.log('Custom Field Update Response: ' + message);
				res.sendStatus(200);
            }
        })
        .catch( function (err) {
            console.log(err.message);
            console.log('Custom Field Update Failed');
            res.sendStatus(200);
        });
    }
}

module.exports = controller;
