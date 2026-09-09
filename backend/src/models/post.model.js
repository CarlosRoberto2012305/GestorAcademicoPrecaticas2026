module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  return sequelize.define('Post', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    titulo: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING(60),
      allowNull: false,
      defaultValue: 'general',
    },
    autorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    destinatarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'publicaciones',
    timestamps: true,
  });
};
