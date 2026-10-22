# inventario-seguro-s8

API REST de gestión de productos con autenticación JWT. Es el módulo base de inventario y control de acceso de un sistema de comercio en línea, desarrollado como práctica de la sesión 8 del curso de Programación Web Avanzada.

Cualquiera puede consultar los productos, pero solo un usuario autenticado puede crearlos, editarlos o borrarlos.

## Alcance

**Incluye**

- Login con correo y clave, que entrega un token JWT con vigencia de 1 hora.
- Claves almacenadas como hash con bcrypt.
- CRUD de productos (nombre y precio) persistido en MongoDB Atlas con Mongoose.
- Protección de las rutas que modifican datos mediante un middleware de verificación de token.
- Validación de los datos de entrada.
- Pruebas automáticas (`node --test`) y una colección de Postman.

**No incluye** (posibles mejoras)

- Stock, categorías, proveedores ni movimientos de inventario. Hoy cada producto solo tiene nombre y precio, por lo que funciona más como catálogo que como inventario completo.
- Registro de usuarios, roles ni recuperación de clave. Existe una única cuenta de demostración.
- Paginación, búsqueda o filtros.
- Límite de intentos de login.
- Carrito, pedidos, pagos ni frontend.

## Tecnologías

- Node.js y Express 5
- MongoDB Atlas y Mongoose
- jsonwebtoken y bcryptjs
- dotenv

## Requisitos

- Node.js 18 o superior
- Un cluster de MongoDB Atlas (el plan gratuito M0 es suficiente)

## Instalación

```bash
npm install
```

## Configuración

Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor. Por defecto, 3000. |
| `JWT_SECRET` | Secreto para firmar los tokens. Debe tener al menos 32 caracteres; si no, la app no arranca. |
| `MONGO_URL` | Cadena de conexión de Atlas (`mongodb+srv://...`) con la contraseña real del usuario de base de datos. No incluyas el nombre de la base: la app usa `inventario`. |

Recomendaciones para Atlas:

- Crea un usuario de base de datos con rol `readWrite` solo sobre `inventario` e `inventario_test`.
- En Network Access permite únicamente tu IP; evita `0.0.0.0/0`.
- Si la contraseña tiene caracteres especiales (`@ : / ? # %`), codifícalos en la URI (por ejemplo, `@` como `%40`).

El archivo `.env` está en `.gitignore`. No lo subas al repositorio.

## Uso

```bash
npm start
```

El servidor se conecta a Atlas y queda escuchando en `http://localhost:3000` (o el puerto de `PORT`). Si la conexión falla, muestra el error y se cierra.

### Endpoints

| Método | Ruta | Token | Descripción |
|---|---|---|---|
| POST | `/api/login` | No | Devuelve un token JWT |
| GET | `/api/productos` | No | Lista los productos |
| POST | `/api/productos` | Sí | Crea un producto |
| PUT | `/api/productos/:id` | Sí | Edita un producto |
| DELETE | `/api/productos/:id` | Sí | Elimina un producto |

Las rutas protegidas esperan el header `Authorization: Bearer <token>`.

### Ejemplos

Iniciar sesión con la cuenta de demostración:

```bash
curl -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"correo":"docente@demo.test","clave":"Clase2026!"}'
```

Crear un producto:

```bash
curl -X POST http://localhost:3000/api/productos \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Cuaderno","precio":10.99}'
```

Editar un producto:

```bash
curl -X PUT http://localhost:3000/api/productos/<id> \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Cuaderno universitario","precio":12.5}'
```

Eliminar un producto:

```bash
curl -X DELETE http://localhost:3000/api/productos/<id> \
  -H "Authorization: Bearer <token>"
```

### Respuestas

| Código | Cuándo ocurre |
|---|---|
| 200 / 201 / 204 | Operación correcta (consulta o edición / creación / borrado) |
| 400 | Nombre vacío o precio inválido (negativo o que no es número) |
| 401 | Credenciales incorrectas, o token ausente, inválido o vencido |
| 404 | El producto no existe o el id no tiene un formato válido |

Los productos usan el `_id` que genera MongoDB.

> La cuenta `docente@demo.test` / `Clase2026!` es solo para demostración en clase. No uses credenciales fijas en producción.

## Pruebas

### Automáticas

```bash
npm test
```

Ejecuta `test/flujo.test.js`, que cubre el login y el flujo completo del CRUD. Usa su propia copia de la app y la base `inventario_test`, que queda vacía al terminar, así que no toca los datos de `inventario`.

### Postman

En la carpeta `postman/` hay dos archivos que se importan juntos:

- `inventario-seguro-s8.postman_collection.json`: las 10 peticiones con sus tests.
- `inventario-seguro-s8.postman_environment.json`: las variables `baseUrl`, `token` y `productoId`.

Pasos:

1. En Postman, usa **Import** y selecciona ambos archivos.
2. Elige el entorno **inventario-seguro-s8 (local)** y ajusta `baseUrl` si tu puerto no es el 3000.
3. Arranca la API con `npm start`.
4. Ejecuta la colección con **Run collection**, en orden.

La colección actúa sobre la base `inventario` (la que usa `npm start`) y borra el producto de prueba al final.

## Estructura del proyecto

```
.
├── src/
│   ├── server.js            # Conexión a Atlas y arranque del servidor
│   ├── app.js               # Rutas, login y middleware de autenticación
│   └── models/
│       └── Producto.js      # Modelo de Mongoose
├── test/
│   └── flujo.test.js        # Pruebas automáticas
├── postman/                 # Colección y entorno de Postman
├── .env.example             # Plantilla de variables de entorno
└── package.json
```
