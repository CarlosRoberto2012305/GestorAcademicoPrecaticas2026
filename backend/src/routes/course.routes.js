const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { courseValidation, idParamValidation } = require('../validators');
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/course.controller');

const router = express.Router();

router.get('/', authMiddleware, getCourses);
router.get('/:id', authMiddleware, idParamValidation, validationMiddleware, getCourseById);
router.post('/', authMiddleware, roleMiddleware('admin', 'profesor'), courseValidation, validationMiddleware, createCourse);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'profesor'), idParamValidation, courseValidation, validationMiddleware, updateCourse);
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'profesor'), idParamValidation, validationMiddleware, deleteCourse);

module.exports = router;
