# Gestor Academico

Aplicacion web para gestionar usuarios, cursos y calificaciones academicas. El proyecto contiene una API REST con autenticacion JWT y una interfaz React que consulta y actualiza la informacion del backend automaticamente.

## Funcionalidades

- Registro e inicio de sesion con contrasenas cifradas mediante `bcrypt`.
- Autenticacion con tokens JWT.
- Roles de usuario: `admin`, `profesor` y `estudiante`.
- Control de permisos para operaciones de cursos y calificaciones.
- CRUD de cursos.
- CRUD de calificaciones.
- CRUD de usuarios para administradores y gestión de alumnos para profesores.
- Comentarios de estudiantes dirigidos a catedráticos y filtrados por destinatario.
- El profesor puede actualizar la nota y el comentario de sus alumnos en cursos asignados.
- Consulta de usuarios sin exponer `passwordHash`.
- Reportes de calificaciones por curso y estudiante.
- Validacion de entradas con `express-validator`.
- Seguridad HTTP con Helmet, CORS, limite de peticiones y limite del cuerpo JSON.
- Dashboard principal en React con estado del backend, usuarios, cursos y calificaciones.
- Actualizacion automatica del dashboard cada 5 segundos.
- Ejecucion persistente del backend con PM2.

## Tecnologias

### Backend

- Node.js
- Express
- Sequelize
- MySQL
- JSON Web Token
- bcrypt
- express-validator
- Helmet
- express-rate-limit
- PM2

### Frontend

- React 19
- Vite
- Axios
- React Router DOM

## Estructura

```text
GestorAcademicoPrecaticas2026/
├── backend/
│   ├── config/
│   └── src/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── validators/
│       ├── app.js
│       └── server.js
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── index.css
└── README.md
```

## Requisitos

- Node.js 18 o superior.
- pnpm.
- MySQL ejecutandose en el puerto `3306`.
- Base de datos `sistema_calificacion_cursos`.

## Configuracion del backend

En `backend/.env` define las variables necesarias:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sistema_calificacion_cursos
DB_USER=app_user
DB_PASSWORD=app_user
JWT_SECRET=usa_un_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=8h
```

El usuario configurado debe tener permisos sobre la base de datos indicada.

## Esquema academico extendido

El esquema SQL compatible se encuentra en `backend/database/schema.sql`. Incluye `Persona`, `Usuario`, `Catedratico`, `Curso`, `Curso_Catedratico`, `Calificacion`, `Publicacion`, `Comentario` y `Curso_Aprobado`.

Para copiar los datos existentes de las tablas legacy al esquema nuevo:

```powershell
cd backend
pnpm run db:migrate:schema
```

La migracion es aditiva e idempotente: no elimina las tablas actuales ni borra datos.

## Usuarios iniciales

Al iniciar el backend se crean estas cuentas si todavía no existen:

| Rol | Nombre | Email | Contrasena |
| --- | --- | --- | --- |
| Administrador | Admin General | `admin@demo.com` | `Admin12345!` |
| Profesor | Profesor Demo | `profesor@demo.com` | `Profesor12345!` |
| Estudiante | Estudiante Demo | `estudiante@demo.com` | `Estudiante12345!` |

Los datos de estas cuentas se encuentran en `backend/config/default-users.js`. Cambia las credenciales antes de usar el sistema en produccion.

## Permisos por rol

| Rol | Permisos |
| --- | --- |
| `admin` | Gestionar usuarios, cursos, calificaciones y comentarios. Puede crear, editar y eliminar información. |
| `profesor` | Ver cursos asignados, administrar alumnos, ver comentarios dirigidos a él y modificar notas/comentarios de sus alumnos. No puede crear o eliminar notas ni modificar cursos. |
| `estudiante` | Ver únicamente sus cursos asignados con catedrático, consultar sus notas y enviar comentarios al catedrático de un curso asignado. |

## Instalacion

Desde la raiz del proyecto:

```powershell
cd backend
pnpm install

cd ..\frontend
pnpm install
```

## Ejecucion

### Backend en desarrollo

```powershell
cd backend
pnpm run dev
```

La API queda disponible en `http://localhost:3000`.

### Backend persistente con PM2

```powershell
cd backend
pnpm run start:pm2
pnpm exec pm2 save
```

Comandos utiles:

```powershell
pnpm run restart:pm2
pnpm run stop:pm2
pnpm run logs:pm2
pnpm exec pm2 status
```

### Frontend

En otra terminal:

```powershell
cd frontend
pnpm run dev
```

Abre `http://127.0.0.1:5173/` en el navegador.

Para generar la version de produccion:

```powershell
pnpm run build
```

## API principal

La URL base es `http://localhost:3000/api`.

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/health` | Comprueba que la API esta activa |
| POST | `/auth/register` | Registra un usuario |
| POST | `/auth/login` | Inicia sesion y devuelve un JWT |
| GET | `/users` | Lista usuarios sin contrasenas; admin ve todos y profesor solo alumnos |
| POST | `/users` | Crea un usuario; admin o profesor, el profesor crea alumnos |
| PUT | `/users/:id` | Actualiza usuario; admin o profesor sobre alumnos |
| DELETE | `/users/:id` | Elimina usuario; admin o profesor sobre alumnos |
| GET | `/users/professors` | Lista catedráticos disponibles para el usuario autenticado |
| GET | `/users/profile` | Consulta el perfil autenticado |
| GET | `/courses` | Lista cursos, requiere JWT |
| POST | `/courses` | Crea un curso; solo admin |
| PUT | `/courses/:id` | Actualiza un curso; solo admin |
| DELETE | `/courses/:id` | Elimina un curso; solo admin |
| GET | `/courses/:id/grades` | Lista calificaciones de un curso |
| GET | `/courses/:id/stats` | Consulta estadisticas de un curso |
| GET | `/grades` | Lista notas del alumno, del profesor en sus cursos o todas para admin |
| POST | `/grades` | Crea una calificacion; solo admin |
| PUT | `/grades/:id` | Admin edita cualquier nota; profesor edita nota/comentario de cursos asignados |
| DELETE | `/grades/:id` | Elimina una calificacion; solo admin |
| GET | `/grades/student/:studentId` | Lista calificaciones de un estudiante |
| GET | `/grades/summary/:studentId` | Consulta resumen del estudiante |
| GET | `/posts` | Admin ve todos, profesor sus comentarios y estudiante los propios |
| POST | `/posts` | Crea comentario dirigido a un catedrático de un curso asignado |
| DELETE | `/posts/:id` | Elimina comentario; solo admin |

Para rutas protegidas envia el token asi:

```http
Authorization: Bearer <token>
```

## Dashboard en tiempo real

La pagina principal del frontend consulta automaticamente estos recursos:

- `/api/health`
- `/api/users`
- `/api/courses`
- `/api/grades`
- `/api/posts`

El estado del backend se muestra por separado de los recursos protegidos. Por eso un error `401` en cursos o calificaciones se informa como falta de autenticacion y no como una falla de la base de datos.

## Verificacion

Comprueba el estado de la API con:

```powershell
curl.exe http://localhost:3000/api/health
```

La respuesta esperada contiene:

```json
{
	"ok": true,
	"message": "API funcionando correctamente"
}
```

## Ramas principales

- `develop`: backend y funcionalidades base.
- `developFront`: frontend React, dashboard y ejecucion persistente con PM2.
