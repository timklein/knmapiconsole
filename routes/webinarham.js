//Routes for WebinarHam
const express = require('express');
const webinarham = require('../controllers/webinarhamController');
var router = express.Router();

// POST WebinarHam
router.post('/', webinarham.getToken, webinarham.getIds, webinarham.addTag, webinarham.updateTime);

module.exports = router;
