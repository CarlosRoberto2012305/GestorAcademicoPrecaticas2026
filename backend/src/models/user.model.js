module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');

  return sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('admin', 'profesor', 'estudiante'),
      allowNull: false,
      defaultValue: 'estudiante',
    },
  }, {
    tableName: 'usuarios',
    timestamps: true,
  });
};
