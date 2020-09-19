//Routes to accept incoming webhooks
const express = require('express');
const keapGoalController = require('../controllers/keapGoalController');
const knmapiController = require('../controllers/knmapiController');
const router = express.Router();

// Receive Agenda trigger to copy of master corporate client list to affiliates
const clientList = require('../controllers/corpClientListController');
router.get('/clientList', knmapiController.accessConfirmation, clientList.getToken, clientList.retrieveList, clientList.updateAffiliates);

// Receive webhook, retrieve access token and complete a goal in Infusionsoft/Keap
router.post('/:integration/:callName', keapGoalController.getToken, keapGoalController.completeGoal);
  
module.exports = router;
