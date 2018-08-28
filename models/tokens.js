const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    connection_name : { type : String },
    app_code : { type : String },
	access_token : { type : String },
	token_type : { type : String },
	expires_in : { type : String },
	refresh_token : { type : String },
    scope : { type : String },
    expires_at : { type : Date }
});

let Connection = mongoose.model('token', tokenSchema);

module.exports = Connection