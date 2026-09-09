const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { createPost, deletePost, getPosts } = require('../controllers/post.controller');

const router = express.Router();

router.get('/', authMiddleware, getPosts);
router.post('/', authMiddleware, createPost);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deletePost);

module.exports = router;
