const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'Token no proporcionado.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await User.findByPk(decoded.sub);

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Usuario no válido.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, message: 'Token inválido o expirado.' });
  }
};
