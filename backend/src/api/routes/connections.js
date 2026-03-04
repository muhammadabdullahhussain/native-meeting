const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Protect all routes below

router.post('/request/:userId', connectionController.sendRequest);
router.get('/pending', connectionController.getPendingRequests);
router.get('/my-friends', connectionController.getMyFriends);
router.get('/status/:userId', connectionController.getStatus);
router.post('/block/:userId', connectionController.blockUser);
router.post('/unblock/:userId', connectionController.unblockUser);
router.post('/report/:userId', connectionController.reportUser);
router.patch('/resolve/:requestId', connectionController.resolveRequest);
router.get('/blocked', connectionController.getBlockedUsers);

module.exports = router;
