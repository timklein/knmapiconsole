//Routes for Callrail Updates to Infusionsoft
const express = require('express');
// const webinarham = require('../controllers/callrailController');
var router = express.Router();

// POST Callrail
router.post('/', function (req, res) {
    console.log(req.body);
    res.sendStatus(200);
});

module.exports = router;
