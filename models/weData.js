const mongoose = require('mongoose');

const weDataSchema = mongoose.Schema({
	id : { type : Number },
	integration : { type : String }, 
	email : { type : String },
	lastName : { type : String },
	firstName : { type : String },
	phone : { type : String },
	address1 : { type : String },
	address2 : { type : String },
	city : { type : String },
	state : { type : String },
	zip : { type : String },
	weData : { type : {} }
});

let Result = mongoose.model('returnedResult', weDataSchema);

module.exports = Result;