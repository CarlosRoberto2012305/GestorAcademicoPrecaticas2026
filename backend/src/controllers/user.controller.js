const { User } = require('../models');

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
