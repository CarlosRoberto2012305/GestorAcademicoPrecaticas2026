const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { getUsers, getProfile } = require('../controllers/user.controller');

const router = express.Router();

router.get('/', getUsers);
router.use(authMiddleware);
router.get('/profile', getProfile);

module.exports = router;
