const mongoose = require('mongoose');

const configSchema = mongoose.Schema({
	company_name : { type : String }, 
	app_code : { type : String }
});

let CallConfig = mongoose.model('config', configSchema);

module.exports = CallConfig;