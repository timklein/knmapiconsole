const mongoose = require('mongoose');

const newsletterSchema = mongoose.Schema({
	feed_url : { type : String }, 
	app_code : { type : String },
	from_id : { type : Number },
	tag_id : { type : Number}
});

let NewsletterConfig = mongoose.model('newsletter', newsletterSchema);

module.exports = NewsletterConfig;