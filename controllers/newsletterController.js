const rp = require('request-promise-native');
const Newsletter = require('../models/newsletterConfig');

const controller = {

    createConfig : function (req, res) {

        let newConfig = new Newsletter ({
            feed_url : req.query.rssFeed,
            app_code : req.query.appCode,
            from_id : req.query.userID,
            tag_id : req.query.tagID
        });
        
        newConfig.save( function (err, config) {
            if(err) {return console.error(err);}
            console.log('Newsletter Config Saved');
            res.redirect('/newsletter');
        });
    },
    configList : function (req, res, next) {
        Newsletter.find({}, function (err, configurations) {

            if (err) {
				res.send(err);
            }
            else if (configurations.length) {
                req.configurations = configurations
                next();
            }
            else {
                next();
            }
        });
    }
}

module.exports = controller;