const { sequelize, Grade, User, Course } = require('../models');

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

    if (req.user.rol === 'profesor') {
      const [assignedCourses] = await sequelize.query(`
        SELECT legacyCourse.id
        FROM Curso_Catedratico cc
        INNER JOIN Curso newCourse ON newCourse.id_curso = cc.id_curso
        INNER JOIN cursos legacyCourse ON legacyCourse.codigo = newCourse.codigo_curso
        INNER JOIN Catedratico c ON c.id_catedratico = cc.id_catedratico
        INNER JOIN Persona p ON p.id_persona = c.id_persona
        INNER JOIN usuarios legacyProfessor ON legacyProfessor.email = p.correo_electronico
        WHERE legacyProfessor.id = ?
      `, { replacements: [req.user.id] });
      where.courseId = assignedCourses.map((course) => course.id);
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

exports.getGradesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findByPk(courseId);

    if (!course) {
      return res.status(404).json({ ok: false, message: 'Curso no encontrado.' });
    }

    if (req.user.rol === 'estudiante') {
      const studentGrades = await Grade.findAll({
        where: { courseId, studentId: req.user.id },
        include: [{ model: Course, as: 'course', attributes: ['id', 'nombre', 'codigo'] }],
      });

      return res.json({ ok: true, course: { id: course.id, nombre: course.nombre, codigo: course.codigo }, grades: studentGrades });
    }

    const grades = await Grade.findAll({
      where: { courseId },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'nombre', 'codigo'] },
        { model: User, as: 'student', attributes: ['id', 'nombre', 'email', 'rol'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ ok: true, course: { id: course.id, nombre: course.nombre, codigo: course.codigo }, grades: grades.map(serializeGrade) });
  } catch (error) {
    return next(error);
  }
};

exports.getGradesByStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await User.findByPk(studentId, { attributes: ['id', 'nombre', 'email', 'rol'] });

    if (!student) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }

    if (req.user.rol === 'estudiante' && Number(studentId) !== Number(req.user.id)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para ver calificaciones de otro estudiante.' });
    }

    const grades = await Grade.findAll({
      where: { studentId },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'nombre', 'codigo'] },
        { model: User, as: 'student', attributes: ['id', 'nombre', 'email', 'rol'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      ok: true,
      student,
      grades: grades.map(serializeGrade),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getStudentSummary = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await User.findByPk(studentId, { attributes: ['id', 'nombre', 'email', 'rol'] });

    if (!student) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }

    if (req.user.rol === 'estudiante' && Number(studentId) !== Number(req.user.id)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para ver el resumen de otro estudiante.' });
    }

    const grades = await Grade.findAll({
      where: { studentId },
      attributes: ['score'],
    });

    if (!grades.length) {
      return res.json({
        ok: true,
        student,
        summary: {
          totalCalificaciones: 0,
          promedioGeneral: 0,
          notaMaxima: 0,
          notaMinima: 0,
          aprobadas: 0,
          reprobadas: 0,
        },
      });
    }

    const scores = grades.map((g) => Number(g.score));
    const promedioGeneral = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    const notaMaxima = Math.max(...scores);
    const notaMinima = Math.min(...scores);
    const aprobadas = scores.filter((value) => value >= 70).length;
    const reprobadas = scores.filter((value) => value < 70).length;

    return res.json({
      ok: true,
      student,
      summary: {
        totalCalificaciones: scores.length,
        promedioGeneral: Number(promedioGeneral.toFixed(2)),
        notaMaxima: Number(notaMaxima.toFixed(2)),
        notaMinima: Number(notaMinima.toFixed(2)),
        aprobadas,
        reprobadas,
      },
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
    if (!['admin', 'profesor'].includes(req.user.rol)) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para actualizar calificaciones.' });
    }

    const { id } = req.params;
    const grade = await Grade.findByPk(id);

    if (!grade) {
      return res.status(404).json({ ok: false, message: 'Calificación no encontrada.' });
    }

    if (req.user.rol === 'profesor') {
      const [assignedCourse] = await sequelize.query(`
        SELECT legacyCourse.id
        FROM Curso_Catedratico cc
        INNER JOIN Curso newCourse ON newCourse.id_curso = cc.id_curso
        INNER JOIN cursos legacyCourse ON legacyCourse.codigo = newCourse.codigo_curso
        INNER JOIN Catedratico c ON c.id_catedratico = cc.id_catedratico
        INNER JOIN Persona p ON p.id_persona = c.id_persona
        INNER JOIN usuarios legacyProfessor ON legacyProfessor.email = p.correo_electronico
        WHERE legacyProfessor.id = ? AND legacyCourse.id = ?
        LIMIT 1
      `, { replacements: [req.user.id, grade.courseId] });

      if (!assignedCourse.length) {
        return res.status(403).json({ ok: false, message: 'Solo puedes modificar notas de tus cursos asignados.' });
      }
    }

    const { score, periodo, comentario, courseId, studentId } = req.body;

    if (score !== undefined) {
      const numericScore = Number(score);
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        return res.status(400).json({ ok: false, message: 'La calificación debe estar entre 0 y 100.' });
      }
      grade.score = numericScore;
    }

    if (req.user.rol === 'admin') {
      if (periodo !== undefined) grade.periodo = String(periodo).trim();
      if (courseId !== undefined) grade.courseId = Number(courseId);
      if (studentId !== undefined) grade.studentId = Number(studentId);
    }
    if (comentario !== undefined) grade.comentario = comentario ? String(comentario).trim() : null;

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
