const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { User } = require('../models');

const signToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      rol: user.rol,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
};

const sanitizeUser = (user) => ({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  rol: user.rol,
});

exports.register = async (req, res, next) => {
  try {
    const { nombre, email, password, rol = 'estudiante' } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Faltan nombre, email o password.' });
    }

    if (typeof password !== 'string' || password.length <= 8) {
      return res.status(400).json({
        ok: false,
        message: 'La contraseña debe tener más de 8 caracteres.',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedNombre = String(nombre).trim();

    if (password.toLowerCase() === normalizedEmail.toLowerCase() || password.toLowerCase() === normalizedNombre.toLowerCase()) {
      return res.status(400).json({
        ok: false,
        message: 'La contraseña no puede ser igual al usuario o al email.',
      });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ ok: false, message: 'El correo ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ nombre: normalizedNombre, email: normalizedEmail, passwordHash, rol });
    const token = signToken(user);

    return res.status(201).json({
      ok: true,
      message: 'Usuario registrado correctamente.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email y password son requeridos.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas.' });
    }

    const token = signToken(user);

    return res.json({
      ok: true,
      message: 'Login exitoso.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};
