const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { createUser, deleteUser, getProfessors, getUsers, getProfile, updateUser } = require('../controllers/user.controller');

const router = express.Router();

router.use(authMiddleware);
router.get('/professors', getProfessors);
router.get('/', roleMiddleware('admin', 'profesor'), getUsers);
router.post('/', roleMiddleware('admin'), createUser);
router.put('/:id', roleMiddleware('admin'), updateUser);
router.delete('/:id', roleMiddleware('admin'), deleteUser);
router.get('/profile', getProfile);

module.exports = router;
