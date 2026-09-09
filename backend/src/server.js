const app = require('./app');
const env = require('../config/env');
const { sequelize } = require('./models');

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
    logAlert('info', 'Modelos sincronizados con la base de datos.');

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