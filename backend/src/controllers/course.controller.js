const { sequelize, Course, Grade, User } = require('../models');

const canManageCourses = (user) => ['admin', 'profesor'].includes(user?.rol);

exports.getCourses = async (req, res, next) => {
  try {
    const include = req.user?.rol === 'estudiante'
      ? [{
        model: Grade,
        as: 'grades',
        attributes: [],
        where: { studentId: req.user.id },
        required: true,
      }]
      : [];

    const courses = await Course.findAll({
      include,
      distinct: true,
      order: [['id', 'ASC']],
    });

    if (req.user?.rol === 'estudiante') {
      const [assignedProfessors] = await sequelize.query(`
         SELECT legacyCourse.id AS courseId, legacy.id AS id, p.nombres AS nombre,
               p.correo_electronico AS email
        FROM Curso_Catedratico cc
         INNER JOIN Curso newCourse ON newCourse.id_curso = cc.id_curso
         INNER JOIN cursos legacyCourse ON legacyCourse.codigo = newCourse.codigo_curso
        INNER JOIN Catedratico c ON c.id_catedratico = cc.id_catedratico
        INNER JOIN Usuario u ON u.id_usuario = c.id_usuario
        INNER JOIN Persona p ON p.id_persona = c.id_persona
        INNER JOIN usuarios legacy ON legacy.email = p.correo_electronico
        WHERE u.rol = 'profesor'
          AND legacyCourse.id IN (
            SELECT courseId FROM calificaciones WHERE studentId = ?
          )
      `, { replacements: [req.user.id] });

      const professorsByCourse = new Map();
      assignedProfessors.forEach((professor) => {
        if (!professorsByCourse.has(professor.courseId)) professorsByCourse.set(professor.courseId, []);
        professorsByCourse.get(professor.courseId).push({
          id: professor.id,
          nombre: professor.nombre,
          email: professor.email,
          rol: 'profesor',
        });
      });

      courses.forEach((course) => {
        course.setDataValue('catedraticos', professorsByCourse.get(course.id) || []);
      });
    }

    return res.json({
      ok: true,
      courses,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({
        ok: false,
        message: 'Curso no encontrado.',
      });
    }

    return res.json({
      ok: true,
      course,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getCourseGrades = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({
        ok: false,
        message: 'Curso no encontrado.',
      });
    }

    const grades = await Grade.findAll({
      where: { courseId: id },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'nombre', 'email', 'rol'],
      }],
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      ok: true,
      course: {
        id: course.id,
        nombre: course.nombre,
        codigo: course.codigo,
      },
      grades,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getCourseStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({
        ok: false,
        message: 'Curso no encontrado.',
      });
    }

    const grades = await Grade.findAll({
      where: { courseId: id },
      attributes: ['score', 'studentId'],
    });

    if (!grades.length) {
      return res.json({
        ok: true,
        course: {
          id: course.id,
          nombre: course.nombre,
          codigo: course.codigo,
        },
        stats: {
          totalEstudiantes: 0,
          promedio: 0,
          notaMaxima: 0,
          notaMinima: 0,
          aprobados: 0,
          reprobados: 0,
        },
      });
    }

    const scores = grades.map((g) => Number(g.score));
    const total = scores.reduce((sum, value) => sum + value, 0);
    const promedio = total / scores.length;
    const notaMaxima = Math.max(...scores);
    const notaMinima = Math.min(...scores);
    const aprobados = scores.filter((value) => value >= 70).length;
    const reprobados = scores.filter((value) => value < 70).length;

    return res.json({
      ok: true,
      course: {
        id: course.id,
        nombre: course.nombre,
        codigo: course.codigo,
      },
      stats: {
        totalEstudiantes: grades.length,
        promedio: Number(promedio.toFixed(2)),
        notaMaxima: Number(notaMaxima.toFixed(2)),
        notaMinima: Number(notaMinima.toFixed(2)),
        aprobados,
        reprobados,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    if (!canManageCourses(req.user)) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permisos para crear cursos.',
      });
    }

    const { nombre, codigo, descripcion, creditos } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({
        ok: false,
        message: 'Nombre y código son obligatorios.',
      });
    }

    const course = await Course.create({
      nombre: nombre.trim(),
      codigo: codigo.trim(),
      descripcion: descripcion ? descripcion.trim() : null,
      creditos: Number(creditos ?? 1),
    });

    return res.status(201).json({
      ok: true,
      message: 'Curso creado correctamente.',
      course,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        ok: false,
        message: 'El código del curso ya existe.',
      });
    }

    return next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    if (!canManageCourses(req.user)) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permisos para actualizar cursos.',
      });
    }

    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({
        ok: false,
        message: 'Curso no encontrado.',
      });
    }

    const { nombre, codigo, descripcion, creditos } = req.body;

    if (nombre !== undefined) course.nombre = nombre.trim();
    if (codigo !== undefined) course.codigo = codigo.trim();
    if (descripcion !== undefined) course.descripcion = descripcion ? descripcion.trim() : null;
    if (creditos !== undefined) course.creditos = Number(creditos);

    await course.save();

    return res.json({
      ok: true,
      message: 'Curso actualizado correctamente.',
      course,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        ok: false,
        message: 'El código del curso ya existe.',
      });
    }

    return next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    if (!canManageCourses(req.user)) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permisos para eliminar cursos.',
      });
    }

    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({
        ok: false,
        message: 'Curso no encontrado.',
      });
    }

    await course.destroy();

    return res.json({
      ok: true,
      message: 'Curso eliminado correctamente.',
      id: Number(id),
    });
  } catch (error) {
    return next(error);
  }
};
