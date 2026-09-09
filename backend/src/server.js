const app = require('./app');
const env = require('../config/env');
const { sequelize } = require('./models');
const { seedDatabase } = require('./seed');

const logAlert = (level, message) => {
  const prefix = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : '✅';
  console.log(`${prefix} ALERTA: ${message}`);
};

async function start() {
  try {
    logAlert('info', 'Servidor iniciando...');

    await sequelize.authenticate();
    logAlert('info', 'Autenticación de la base de datos exitosa.');
    logAlert('info', 'Se conectó correctamente a MySQL.');

    await sequelize.sync();
    const queryInterface = sequelize.getQueryInterface();
    const postColumns = await queryInterface.describeTable('publicaciones');
    if (!postColumns.destinatarioId) {
      await queryInterface.addColumn('publicaciones', 'destinatarioId', { type: 'INTEGER', allowNull: true });
    }
    if (!postColumns.courseId) {
      await queryInterface.addColumn('publicaciones', 'courseId', { type: 'INTEGER', allowNull: true });
    }
    logAlert('info', 'Modelos sincronizados con la base de datos.');

    await seedDatabase();
    logAlert('info', 'Datos iniciales generados en todas las tablas.');

    app.listen(env.port, () => {
      logAlert('info', `La API está funcionando en http://localhost:${env.port}`);
      logAlert('info', `Servidor arrancado correctamente en el puerto ${env.port}.`);
    });
  } catch (error) {
    logAlert('error', 'No se pudo iniciar el servidor.');
    console.error(error);
    process.exit(1);
  }
}

start();