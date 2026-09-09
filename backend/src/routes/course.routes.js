const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/course.controller');

const router = express.Router();

router.get('/', authMiddleware, getCourses);
router.get('/:id', authMiddleware, getCourseById);
router.post('/', authMiddleware, createCourse);
router.put('/:id', authMiddleware, updateCourse);
router.delete('/:id', authMiddleware, deleteCourse);

module.exports = router;
