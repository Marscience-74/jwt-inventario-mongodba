const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Producto = require('./models/Producto');
const app = express();

require('dotenv').config();

app.use(express.json());

if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('La variable de entorno JWT_SECRET debe estar definida y tener al menos 32 caracteres');
} 

// Cuenta exclusivamente de demostración: nunca usar credenciales fijas en producción.
const usuarioDemo = {
  correo: 'docente@demo.test',
  hash: bcrypt.hashSync('Clase2026!', 10)
};

function verificarToken(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const [tipo, token] = cabecera.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

app.post('/api/login', (req, res) => {
  const { correo, clave } = req.body ?? {};
  if (correo !== usuarioDemo.correo ||
      typeof clave !== 'string' ||
      !bcrypt.compareSync(clave, usuarioDemo.hash)) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  const token = jwt.sign(
    { id: 1, correo: usuarioDemo.correo },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return res.json({ token });
});

function datosValidos(nombre, precio) {
    return typeof nombre === 'string' && nombre.trim().length > 0 &&
           typeof precio === 'number' && precio >= 0;
}

app.get('/api/productos', async (req, res) => {
    res.json(await Producto.find());
});

app.post('/api/productos', verificarToken, async (req, res) => {
    const { nombre, precio } = req.body ?? {};
    if(!datosValidos(nombre, precio)) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }
    const nuevoProducto = await Producto.create({ nombre, precio });
    res.status(201).json(nuevoProducto);
});

app.put('/api/productos/:id', verificarToken, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  const { nombre, precio } = req.body ?? {};
  if (!datosValidos(nombre, precio)) {
    return res.status(400).json({ error: 'Nombre o precio inválido' });
  }
  const producto = await Producto.findByIdAndUpdate(
    req.params.id,
    { nombre: nombre.trim(), precio },
    { returnDocument: 'after' }
  );
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  return res.json(producto);
});

app.delete('/api/productos/:id', verificarToken, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  const producto = await Producto.findByIdAndDelete(req.params.id);
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  return res.status(204).send();
});

module.exports = app;