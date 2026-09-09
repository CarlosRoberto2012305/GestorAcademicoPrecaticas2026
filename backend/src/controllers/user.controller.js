const { User } = require('../models');

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
