const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { createPost, getPosts } = require('../controllers/post.controller');

const router = express.Router();

router.get('/', authMiddleware, getPosts);
router.post('/', authMiddleware, createPost);

module.exports = router;
