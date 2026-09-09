module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  return sequelize.define('Grade', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    periodo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '2026',
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'calificaciones',
    timestamps: true,
  });
};
