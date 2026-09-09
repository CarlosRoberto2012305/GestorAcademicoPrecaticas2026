module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        message: 'Debe iniciar sesión para continuar.',
      });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permisos para esta acción.',
      });
    }

    return next();
  };
};
