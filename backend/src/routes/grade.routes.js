const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { gradeValidation, idParamValidation } = require('../validators');
const {
  getGrades,
  getGradeById,
  getGradesByCourse,
  getGradesByStudent,
  getStudentSummary,
  createGrade,
  updateGrade,
  deleteGrade,
} = require('../controllers/grade.controller');

const router = express.Router();

router.get('/', authMiddleware, getGrades);
router.get('/course/:courseId', authMiddleware, idParamValidation, validationMiddleware, getGradesByCourse);
router.get('/student/:studentId', authMiddleware, idParamValidation, validationMiddleware, getGradesByStudent);
router.get('/summary/:studentId', authMiddleware, idParamValidation, validationMiddleware, getStudentSummary);
router.get('/:id', authMiddleware, idParamValidation, validationMiddleware, getGradeById);
router.post('/', authMiddleware, roleMiddleware('admin', 'profesor'), gradeValidation, validationMiddleware, createGrade);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'profesor'), idParamValidation, gradeValidation, validationMiddleware, updateGrade);
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'profesor'), idParamValidation, validationMiddleware, deleteGrade);

module.exports = router;
