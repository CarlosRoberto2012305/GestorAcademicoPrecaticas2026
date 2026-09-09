const { Grade, User, Course } = require('../models');

const canManageGrades = (user) => ['admin', 'profesor'].includes(user?.rol);

const serializeGrade = (grade) => ({
  ...grade.toJSON(),
  course: grade.course ? {
    id: grade.course.id,
    nombre: grade.course.nombre,
    codigo: grade.course.codigo,
  } : null,
  student: grade.student ? {
    id: grade.student.id,
    nombre: grade.student.nombre,
    email: grade.student.email,
    rol: grade.student.rol,
  } : null,
});

exports.getGrades = async (req, res, next) => {
  try {
    const where = {};

    if (req.user.rol === 'estudiante') {
      where.studentId = req.user.id;
    }

    const grades = await Grade.findAll({
      where,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'nombre', 'codigo'] },
        { model: User, as: 'student', attributes: ['id', 'nombre', 'email', 'rol'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      ok: true,
      grades: grades.map(serializeGrade),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getGradeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const grade = await Grade.findByPk(id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'nombre', 'codigo'] },
        { model: User, as: 'student', attributes: ['id', 'nombre', 'email', 'rol'] },
      ],
    });

    if (!grade) {
      return res.status(404).json({ ok: false, message: 'Calificación no encontrada.' });
    }

    if (req.user.rol === 'estudiante' && grade.studentId !== req.user.id) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para ver esta calificación.' });
    }

    return res.json({ ok: true, grade: serializeGrade(grade) });
  } catch (error) {
    return next(error);
  }
};

exports.createGrade = async (req, res, next) => {
  try {
    if (!canManageGrades(req.user)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para crear calificaciones.' });
    }

    const { score, periodo, comentario, courseId, studentId } = req.body;

    if (score === undefined || !periodo || !courseId || !studentId) {
      return res.status(400).json({
        ok: false,
        message: 'score, periodo, courseId y studentId son obligatorios.',
      });
    }

    const numericScore = Number(score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return res.status(400).json({
        ok: false,
        message: 'La calificación debe estar entre 0 y 100.',
      });
    }

    const grade = await Grade.create({
      score: numericScore,
      periodo: String(periodo).trim(),
      comentario: comentario ? String(comentario).trim() : null,
      courseId: Number(courseId),
      studentId: Number(studentId),
    });

    const created = await Grade.findByPk(grade.id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'nombre', 'codigo'] },
        { model: User, as: 'student', attributes: ['id', 'nombre', 'email', 'rol'] },
      ],
    });

    return res.status(201).json({
      ok: true,
      message: 'Calificación creada correctamente.',
      grade: serializeGrade(created),
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateGrade = async (req, res, next) => {
  try {
    if (!canManageGrades(req.user)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para actualizar calificaciones.' });
    }

    const { id } = req.params;
    const grade = await Grade.findByPk(id);

    if (!grade) {
      return res.status(404).json({ ok: false, message: 'Calificación no encontrada.' });
    }

    const { score, periodo, comentario, courseId, studentId } = req.body;

    if (score !== undefined) {
      const numericScore = Number(score);
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        return res.status(400).json({ ok: false, message: 'La calificación debe estar entre 0 y 100.' });
      }
      grade.score = numericScore;
    }

    if (periodo !== undefined) grade.periodo = String(periodo).trim();
    if (comentario !== undefined) grade.comentario = comentario ? String(comentario).trim() : null;
    if (courseId !== undefined) grade.courseId = Number(courseId);
    if (studentId !== undefined) grade.studentId = Number(studentId);

    await grade.save();

    const updated = await Grade.findByPk(grade.id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'nombre', 'codigo'] },
        { model: User, as: 'student', attributes: ['id', 'nombre', 'email', 'rol'] },
      ],
    });

    return res.json({
      ok: true,
      message: 'Calificación actualizada correctamente.',
      grade: serializeGrade(updated),
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteGrade = async (req, res, next) => {
  try {
    if (!canManageGrades(req.user)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para eliminar calificaciones.' });
    }

    const { id } = req.params;
    const grade = await Grade.findByPk(id);

    if (!grade) {
      return res.status(404).json({ ok: false, message: 'Calificación no encontrada.' });
    }

    await grade.destroy();

    return res.json({
      ok: true,
      message: 'Calificación eliminada correctamente.',
      id: Number(id),
    });
  } catch (error) {
    return next(error);
  }
};
