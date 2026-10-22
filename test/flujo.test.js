const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const app = require('../src/app');
const Producto = require('../src/models/Producto');

let servidor;
let base;
let token;

const json = { 'Content-Type': 'application/json' };

before(async () => {
  await mongoose.connect(process.env.MONGO_URL, { dbName: 'inventario_test' });
  await Producto.deleteMany({});
  servidor = app.listen(0);
  base = `http://localhost:${servidor.address().port}/api`;
});

after(async () => {
  await Producto.deleteMany({});
  await mongoose.disconnect();
  servidor.close();
});

test('login rechaza credenciales incorrectas', async () => {
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ correo: 'docente@demo.test', clave: 'incorrecta' })
  });
  assert.equal(res.status, 401);
});

test('login devuelve un token con credenciales correctas', async () => {
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ correo: 'docente@demo.test', clave: 'Clase2026!' })
  });
  assert.equal(res.status, 200);
  token = (await res.json()).token;
  assert.ok(token);
});

test('crear, editar y borrar requieren token', async () => {
  const crear = await fetch(`${base}/productos`, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({ nombre: 'Regla', precio: 5 })
  });
  assert.equal(crear.status, 401);
});

test('flujo completo del CRUD con token', async () => {
  const auth = { ...json, Authorization: `Bearer ${token}` };

  const crear = await fetch(`${base}/productos`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ nombre: '  Regla ', precio: 5 })
  });
  assert.equal(crear.status, 201);
  const creado = await crear.json();
  assert.equal(creado.nombre, 'Regla');

  const invalido = await fetch(`${base}/productos`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ nombre: '', precio: -1 })
  });
  assert.equal(invalido.status, 400);

  const lista = await (await fetch(`${base}/productos`)).json();
  assert.equal(lista.length, 1);

  const editar = await fetch(`${base}/productos/${creado._id}`, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ nombre: 'Regla 30cm', precio: 6 })
  });
  assert.equal(editar.status, 200);
  assert.equal((await editar.json()).nombre, 'Regla 30cm');

  const idMalo = await fetch(`${base}/productos/abc`, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({ nombre: 'x', precio: 1 })
  });
  assert.equal(idMalo.status, 404);

  const borrar = await fetch(`${base}/productos/${creado._id}`, {
    method: 'DELETE',
    headers: auth
  });
  assert.equal(borrar.status, 204);

  const otraVez = await fetch(`${base}/productos/${creado._id}`, {
    method: 'DELETE',
    headers: auth
  });
  assert.equal(otraVez.status, 404);
});
