const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', messageController.send);
router.get('/chat/:userId', messageController.getChat);
router.get('/group/:groupId', messageController.getGroupChat);
router.post('/:messageId/reactions', messageController.toggleReaction);
router.put('/:messageId/delivered', messageController.markDelivered);
router.put('/:messageId/read', messageController.markRead);

module.exports = router;
