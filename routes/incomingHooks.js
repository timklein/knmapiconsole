//Routes to accept incoming webhooks
const express = require('express');
const keapGoalController = require('../controllers/keapGoalController');
var router = express.Router();

// Receive webhook, retrieve access token and complete a goal in Infusionsoft/Keap
router.post('/completeGoal/:integration/:callName', keapGoalController.getToken, keapGoalController.completeGoal);
  
module.exports = router;
