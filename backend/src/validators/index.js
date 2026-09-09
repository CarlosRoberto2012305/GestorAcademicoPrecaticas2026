const { body, param } = require('express-validator');

const isAllowedName = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ .-]+$/;
const isAllowedEmail = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const registerValidation = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.')
    .matches(isAllowedName).withMessage('El nombre solo puede contener letras, espacios, puntos y guiones.'),

  body('email')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage('El email es obligatorio.')
    .matches(isAllowedEmail).withMessage('El email debe tener un formato válido y contener @.'),

  body('password')
    .isString().withMessage('La contraseña debe ser texto.')
    .isLength({ min: 9 }).withMessage('La contraseña debe tener más de 8 caracteres.')
    .custom((value, { req }) => {
      const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
      const normalizedName = String(req.body.nombre || '').trim().toLowerCase();

      if (value.toLowerCase() === normalizedEmail || value.toLowerCase() === normalizedName) {
        throw new Error('La contraseña no puede ser igual al email ni al nombre del usuario.');
      }

      return true;
    }),

  body('rol')
    .optional()
    .isIn(['admin', 'profesor', 'estudiante']).withMessage('El rol debe ser admin, profesor o estudiante.'),
];

const loginValidation = [
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage('El email es obligatorio.')
    .matches(isAllowedEmail).withMessage('El email debe tener un formato válido y contener @.'),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria.')
    .isLength({ min: 9 }).withMessage('La contraseña debe tener más de 8 caracteres.'),
];

const courseValidation = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre del curso es obligatorio.')
    .isLength({ min: 2, max: 150 }).withMessage('El nombre del curso debe tener entre 2 y 150 caracteres.'),

  body('codigo')
    .trim()
    .notEmpty().withMessage('El código del curso es obligatorio.')
    .isLength({ min: 2, max: 50 }).withMessage('El código debe tener entre 2 y 50 caracteres.')
    .matches(/^[A-Z0-9-]+$/).withMessage('El código solo admite letras mayúsculas, números y guiones.'),

  body('descripcion')
    .optional({ values: 'falsy' })
    .isString().withMessage('La descripción debe ser texto.')
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres.'),

  body('creditos')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Los créditos deben ser un número entero entre 1 y 20.'),
];

const gradeValidation = [
  body('score')
    .notEmpty().withMessage('La calificación es obligatoria.')
    .isFloat({ min: 0, max: 100 }).withMessage('La calificación debe estar entre 0 y 100.'),

  body('periodo')
    .trim()
    .notEmpty().withMessage('El periodo es obligatorio.')
    .matches(/^[0-9]{4}[-][0-9]$/).withMessage('El periodo debe tener el formato 2026-1.'),

  body('comentario')
    .optional({ values: 'falsy' })
    .isString().withMessage('El comentario debe ser texto.')
    .isLength({ max: 500 }).withMessage('El comentario no puede exceder 500 caracteres.'),

  body('courseId')
    .notEmpty().withMessage('El courseId es obligatorio.')
    .isInt({ min: 1 }).withMessage('El courseId debe ser un número válido.'),

  body('studentId')
    .notEmpty().withMessage('El studentId es obligatorio.')
    .isInt({ min: 1 }).withMessage('El studentId debe ser un número válido.'),
];

const idParamValidation = [
  param('id').isInt({ min: 1 }).withMessage('El id debe ser un número entero mayor a 0.'),
];

module.exports = {
  registerValidation,
  loginValidation,
  courseValidation,
  gradeValidation,
  idParamValidation,
};
