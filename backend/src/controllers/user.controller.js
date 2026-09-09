const { sequelize, User } = require('../models');
const bcrypt = require('bcrypt');

exports.createUser = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;
    const rol = req.user.rol === 'profesor' ? 'estudiante' : (req.body.rol || 'estudiante');
    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Nombre, email y contraseña son obligatorios.' });
    }

    const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing) return res.status(409).json({ ok: false, message: 'El correo ya está registrado.' });

    const user = await User.create({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 10),
      rol,
    });

    return res.status(201).json({ ok: true, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (error) {
    return next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });

    if (req.user.rol === 'profesor' && user.rol !== 'estudiante') {
      return res.status(403).json({ ok: false, message: 'Solo puedes administrar alumnos.' });
    }

    const { nombre, email, password, rol } = req.body;
    if (nombre !== undefined) user.nombre = nombre.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (req.user.rol === 'admin' && rol !== undefined) user.rol = rol;
    if (password) user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    return res.json({ ok: true, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (error) {
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ ok: false, message: 'No puedes eliminar tu propio usuario.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    if (req.user.rol === 'profesor' && user.rol !== 'estudiante') {
      return res.status(403).json({ ok: false, message: 'Solo puedes administrar alumnos.' });
    }
    await user.destroy();
    return res.json({ ok: true, message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    return next(error);
  }
};

exports.getProfessors = async (req, res, next) => {
  try {
    if (req.user.rol === 'estudiante') {
      const [professors] = await sequelize.query(`
        SELECT DISTINCT legacy.id AS id, p.nombres AS nombre,
               p.correo_electronico AS email, 'profesor' AS rol
        FROM calificaciones g
        INNER JOIN cursos legacyCourse ON legacyCourse.id = g.courseId
        INNER JOIN Curso newCourse ON newCourse.codigo_curso = legacyCourse.codigo
        INNER JOIN Curso_Catedratico cc ON cc.id_curso = newCourse.id_curso
        INNER JOIN Catedratico c ON c.id_catedratico = cc.id_catedratico
        INNER JOIN Usuario u ON u.id_usuario = c.id_usuario
        INNER JOIN Persona p ON p.id_persona = c.id_persona
        INNER JOIN usuarios legacy ON legacy.email = p.correo_electronico
        WHERE g.studentId = ? AND u.rol = 'profesor'
        ORDER BY p.nombres ASC
      `, { replacements: [req.user.id] });
      return res.json({ ok: true, professors });
    }

    const professors = await User.findAll({
      where: { rol: 'profesor' },
      attributes: ['id', 'nombre', 'email', 'rol'],
      order: [['nombre', 'ASC']],
    });

    return res.json({ ok: true, professors });
  } catch (error) {
    return next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const where = req.user.rol === 'profesor' ? { rol: 'estudiante' } : undefined;
    const users = await User.findAll({
      where,
      attributes: { exclude: ['passwordHash'] },
      order: [['id', 'ASC']],
    });

    return res.json({
      ok: true,
      users,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
    });

    return res.json({ ok: true, user });
  } catch (error) {
    return next(error);
  }
};
