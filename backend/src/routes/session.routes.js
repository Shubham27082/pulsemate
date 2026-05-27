const express = require('express');
const { listSessions, revokeSession } = require('../controllers/session.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.get('/', listSessions);
router.delete('/:sessionId', revokeSession);

module.exports = router;
