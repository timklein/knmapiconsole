const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_CONNECT_STRING, { useNewUrlParser : true});

// Use native promises
mongoose.Promise = global.Promise;

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error'));
db.on('open', function() {
	console.log('Connected to MongoDB');
});

module.exports = db;