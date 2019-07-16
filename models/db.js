const mongoose = require('mongoose');

if (process.env.NODE_ENV == 'DEV') {
	mongoose.connect(process.env.MONGODB_DEV_CONNECT_STRING, { useNewUrlParser : true});
} else {
	mongoose.connect(process.env.MONGODB_CONNECT_STRING, { useNewUrlParser : true});
}

// Use native promises
mongoose.Promise = global.Promise;

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection Error'));
db.on('open', function() {
	console.log('Connected to MongoDB');
});

module.exports = db;