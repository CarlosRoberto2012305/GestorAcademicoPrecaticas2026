const { Post, User } = require('../models');

exports.createPost = async (req, res, next) => {
  try {
    const { titulo, contenido, categoria = 'general' } = req.body;

    if (!titulo || !contenido) {
      return res.status(400).json({
        ok: false,
        message: 'Título y contenido son obligatorios.',
      });
    }

    const post = await Post.create({
      titulo,
      contenido,
      categoria,
      autorId: req.user.id,
    });

    const author = await User.findByPk(req.user.id, {
      attributes: ['id', 'nombre', 'email', 'rol'],
    });

    return res.status(201).json({
      ok: true,
      message: 'Publicación creada exitosamente.',
      post: {
        ...post.toJSON(),
        autor: author,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: [{
        model: User,
        as: 'autor',
        attributes: ['id', 'nombre', 'email', 'rol'],
      }],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ ok: true, posts });
  } catch (error) {
    return next(error);
  }
};
