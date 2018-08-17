//Routes for WebinarHam
const express = require('express');
const webinarham = require('../controllers/webinarhamController');
var router = express.Router();

// POST WebinarHam
router.post('/', webinarham.getIds, webinarham.addTag);

module.exports = router;
