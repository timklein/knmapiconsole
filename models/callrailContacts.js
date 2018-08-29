const mongoose = require('mongoose');

const contactSchema = mongoose.Schema({
	id : { type : Number },
	company_name : { type : String }, 
	business_phone_number : { type : String },
	formatted_business_phone_number : { type : String },
	customer_phone_number : { type : String },
	formatted_customer_phone_number : { type : String },
	first_call : { type : Boolean },
	tracking_phone_number : { type : String },
	formatted_tracking_phone_number : { type : String },
	source_name : { type : String },
	formatted_tracking_source : { type : String },
	utm_source : { type : String },
	utm_medium : { type : String },
	utm_campaign : { type : String },
	callername : { type : String },
	callernum : { type : String },
	trackingnum : { type : String },
	created_at : { type : String },
	contactID : { type : Number }
});

let Contact = mongoose.model('contact', contactSchema);

module.exports = Contact;