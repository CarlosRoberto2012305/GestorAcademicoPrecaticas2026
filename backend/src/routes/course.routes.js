const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { courseValidation, idParamValidation } = require('../validators');
const {
  getCourses,
  getCourseById,
  getCourseGrades,
  getCourseStats,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/course.controller');

const router = express.Router();

router.get('/', authMiddleware, getCourses);
router.get('/:id', authMiddleware, idParamValidation, validationMiddleware, getCourseById);
router.get('/:id/grades', authMiddleware, idParamValidation, validationMiddleware, getCourseGrades);
router.get('/:id/stats', authMiddleware, idParamValidation, validationMiddleware, getCourseStats);
router.post('/', authMiddleware, roleMiddleware('admin'), courseValidation, validationMiddleware, createCourse);
router.put('/:id', authMiddleware, roleMiddleware('admin'), idParamValidation, courseValidation, validationMiddleware, updateCourse);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), idParamValidation, validationMiddleware, deleteCourse);

module.exports = router;
