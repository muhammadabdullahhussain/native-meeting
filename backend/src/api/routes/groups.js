const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(groupController.getAllGroups)
    .post(groupController.createGroup);

router.get('/my-groups', groupController.getMyGroups);
router.post('/:id/join', groupController.joinGroup);
router.put('/:id', groupController.updateGroup);
router.post('/:id/members', groupController.addMembers);
router.delete('/:id/members/:userId', groupController.removeMember);
router.patch('/:id/members/:userId/role', groupController.updateMemberRole);
router.post('/:id/requests/:userId', groupController.handleJoinRequest);

module.exports = router;
