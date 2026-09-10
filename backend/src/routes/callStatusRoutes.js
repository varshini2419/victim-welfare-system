const express = require('express');
const { updateCallStatus } = require('../controllers/callStatusController');

const router = express.Router();

router.post('/voice', updateCallStatus);

module.exports = router;