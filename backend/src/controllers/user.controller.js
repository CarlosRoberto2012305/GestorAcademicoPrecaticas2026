const { User } = require('../models');
const bcrypt = require('bcrypt');

exports.createUser = async (req, res, next) => {
  try {
    const { nombre, email, password, rol = 'estudiante' } = req.body;
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

    const { nombre, email, password, rol } = req.body;
    if (nombre !== undefined) user.nombre = nombre.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (rol !== undefined) user.rol = rol;
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
    await user.destroy();
    return res.json({ ok: true, message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    return next(error);
  }
};

exports.getProfessors = async (req, res, next) => {
  try {
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
    const users = await User.findAll({
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
