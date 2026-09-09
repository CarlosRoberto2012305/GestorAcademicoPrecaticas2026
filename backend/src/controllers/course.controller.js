const { Course } = require('../models');

const canManageCourses = (user) => ['admin', 'profesor'].includes(user?.rol);

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.findAll({
      order: [['id', 'ASC']],
    });

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
