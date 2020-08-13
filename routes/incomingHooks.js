//Routes to accept incoming webhooks
const express = require('express');
const keapGoalController = require('../controllers/keapGoalController');
const router = express.Router();

// Receive webhook, retrieve access token and complete a goal in Infusionsoft/Keap
router.post('/:integration/:callName', keapGoalController.getToken, keapGoalController.completeGoal);
  
module.exports = router;
