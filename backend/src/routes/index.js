const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const postRoutes = require('./post.routes');
const courseRoutes = require('./course.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/courses', courseRoutes);

module.exports = router;
