const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  getGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
} = require('../controllers/grade.controller');

const router = express.Router();

router.get('/', authMiddleware, getGrades);
router.get('/:id', authMiddleware, getGradeById);
router.post('/', authMiddleware, createGrade);
router.put('/:id', authMiddleware, updateGrade);
router.delete('/:id', authMiddleware, deleteGrade);

module.exports = router;
