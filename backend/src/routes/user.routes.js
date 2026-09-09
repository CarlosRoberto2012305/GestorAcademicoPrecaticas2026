const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { getProfessors, getUsers, getProfile } = require('../controllers/user.controller');

const router = express.Router();

router.use(authMiddleware);
router.get('/professors', getProfessors);
router.get('/', roleMiddleware('admin', 'profesor'), getUsers);
router.get('/profile', getProfile);

module.exports = router;
