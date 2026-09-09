const sequelize = require('../../config/database');
const User = require('./user.model')(sequelize);
const Course = require('./course.model')(sequelize);
const Grade = require('./grade.model')(sequelize);

Course.hasMany(Grade, { foreignKey: 'courseId', as: 'grades' });
Grade.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

User.hasMany(Grade, { foreignKey: 'studentId', as: 'grades' });
Grade.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

module.exports = { sequelize, User, Course, Grade };
