const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../validators');
const validationMiddleware = require('../middlewares/validation.middleware');

const router = express.Router();

router.post('/register', registerValidation, validationMiddleware, register);
router.post('/login', loginValidation, validationMiddleware, login);

module.exports = router;
