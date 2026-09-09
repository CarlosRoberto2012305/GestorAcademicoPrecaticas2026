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
      validate: {
        isValidName(value) {
          if (!value || typeof value !== 'string') {
            throw new Error('El nombre es obligatorio.');
          }

          if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ .-]+$/.test(value.trim())) {
            throw new Error('El nombre solo puede contener letras, espacios, puntos y guiones.');
          }
        },
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isValidEmail(value) {
          if (!value || typeof value !== 'string') {
            throw new Error('El email es obligatorio.');
          }

          if (!value.includes('@')) {
            throw new Error('El email debe incluir @.');
          }

          if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
            throw new Error('El email solo admite letras, números, puntos, guiones y el símbolo @.');
          }
        },
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
