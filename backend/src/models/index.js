const sequelize = require('../../config/database');
const User = require('./user.model')(sequelize);
const Course = require('./course.model')(sequelize);
const Grade = require('./grade.model')(sequelize);
const Post = require('./post.model')(sequelize);

Course.hasMany(Grade, { foreignKey: 'courseId', as: 'grades' });
Grade.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(Grade, { foreignKey: 'studentId', as: 'grades' });
Grade.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

User.hasMany(Post, { foreignKey: 'autorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'autorId', as: 'autor' });
User.hasMany(Post, { foreignKey: 'destinatarioId', as: 'receivedPosts' });
Post.belongsTo(User, { foreignKey: 'destinatarioId', as: 'destinatario' });
Course.hasMany(Post, { foreignKey: 'courseId', as: 'posts' });
Post.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

module.exports = { sequelize, User, Course, Grade, Post };
