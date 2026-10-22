require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const puerto = Number(process.env.PORT) || 3000;

async function iniciar() {
  if (!process.env.MONGO_URL) {
    throw new Error('La variable de entorno MONGO_URL debe estar definida');
  }
  await mongoose.connect(process.env.MONGO_URL, { dbName: 'inventario' });
  console.log('Conectado a MongoDB Atlas');

  app.listen(puerto, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${puerto}`);
  });
}

iniciar().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});
