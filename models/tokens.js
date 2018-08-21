const mongoose = require('mongoose');
// mongoose.connect(process.env.MONGODB_CONNECT_STRING);

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'Connection Error'));
// db.on('open', function() {
// 	console.log('Connected to MongoDB');
// });

// // Use native promises
// mongoose.Promise = global.Promise;

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