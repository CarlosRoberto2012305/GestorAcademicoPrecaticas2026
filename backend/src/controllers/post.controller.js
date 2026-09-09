const { sequelize, Post, User, Course, Grade } = require('../models');

exports.createPost = async (req, res, next) => {
  try {
    if (req.user.rol !== 'estudiante') {
      return res.status(403).json({
        ok: false,
        message: 'Solo los estudiantes pueden enviar comentarios a profesores.',
      });
    }

    const { titulo, contenido, categoria = 'comentario', destinatarioId, courseId } = req.body;

    if (!titulo || !contenido || !destinatarioId || !courseId) {
      return res.status(400).json({
        ok: false,
        message: 'Título, contenido, profesor y curso son obligatorios.',
      });
    }

    const professor = await User.findOne({ where: { id: destinatarioId, rol: 'profesor' } });
    if (!professor) {
      return res.status(404).json({ ok: false, message: 'Profesor no encontrado.' });
    }

    const assignedCourse = await Grade.findOne({
      where: { studentId: req.user.id, courseId },
    });
    if (!assignedCourse) {
      return res.status(403).json({
        ok: false,
        message: 'Solo puedes comentar cursos que tienes asignados.',
      });
    }

    const [assignedProfessor] = await sequelize.query(`
      SELECT legacy.id
      FROM Curso_Catedratico cc
      INNER JOIN Curso newCourse ON newCourse.id_curso = cc.id_curso
      INNER JOIN cursos legacyCourse ON legacyCourse.codigo = newCourse.codigo_curso
      INNER JOIN Catedratico c ON c.id_catedratico = cc.id_catedratico
      INNER JOIN Usuario u ON u.id_usuario = c.id_usuario
      INNER JOIN Persona p ON p.id_persona = c.id_persona
      INNER JOIN usuarios legacy ON legacy.email = p.correo_electronico
      WHERE legacyCourse.id = ? AND legacy.id = ? AND u.rol = 'profesor'
      LIMIT 1
    `, { replacements: [courseId, destinatarioId] });

    if (!assignedProfessor.length) {
      return res.status(403).json({
        ok: false,
        message: 'El catedrático no está asignado a este curso.',
      });
    }

    const course = await Course.findByPk(courseId);

    const post = await Post.create({
      titulo,
      contenido,
      categoria,
      autorId: req.user.id,
      destinatarioId: professor.id,
      courseId: course.id,
    });

    const [author] = await Promise.all([
      User.findByPk(req.user.id, { attributes: ['id', 'nombre', 'email', 'rol'] }),
    ]);

    return res.status(201).json({
      ok: true,
      message: 'Publicación creada exitosamente.',
      post: {
        ...post.toJSON(),
        autor: author,
        destinatario: professor,
        course,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.rol === 'profesor') where.destinatarioId = req.user.id;
    if (req.user.rol === 'estudiante') where.autorId = req.user.id;

    const posts = await Post.findAll({
      where,
      include: [{
        model: User,
        as: 'autor',
        attributes: ['id', 'nombre', 'email', 'rol'],
      }, {
        model: User,
        as: 'destinatario',
        attributes: ['id', 'nombre', 'email', 'rol'],
      }, {
        model: Course,
        as: 'course',
        attributes: ['id', 'nombre', 'codigo'],
      }],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ ok: true, posts });
  } catch (error) {
    return next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ ok: false, message: 'Solo un administrador puede eliminar comentarios.' });
    }

    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ ok: false, message: 'Comentario no encontrado.' });
    await post.destroy();
    return res.json({ ok: true, message: 'Comentario eliminado correctamente.' });
  } catch (error) {
    return next(error);
  }
};
