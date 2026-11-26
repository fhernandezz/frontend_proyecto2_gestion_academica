# Frontend – Sistema de Gestión Académica (Proyecto 2)

Aplicación web de una sola página (SPA) hecha con **React + Vite + JavaScript**, **Bootstrap 5** y **React Router 6**. Consume la API REST del Proyecto 1. No usa datos simulados: todo se lee y se guarda en la base de datos por medio de la API.

## Repositorios del proyecto

| Parte | Repositorio |
| --- | --- |
| Backend (Proyecto 1, Django REST Framework) | https://github.com/Baster-david2035/Proyecto-1-Gestion-academica |
| Frontend (Proyecto 2, este repositorio) | https://github.com/fhernandezz/frontend_proyecto2_gestion_academica |

El backend se usa tal como se entregó en el Proyecto 1, sin cambios.

## Requisitos

- Node.js 20 o superior (probado con Node 26 LTS) y npm.
- Python y el backend del Proyecto 1 funcionando (ver el README de ese repositorio).

## Cómo ejecutar el proyecto completo

### 1. Clonar los dos repositorios

Conviene dejarlos uno al lado del otro:

```powershell
git clone https://github.com/Baster-david2035/Proyecto-1-Gestion-academica.git
git clone https://github.com/fhernandezz/frontend_proyecto2_gestion_academica.git
```

### 2. Levantar el backend (Django)

Dentro de `Proyecto-1-Gestion-academica`, siguiendo su README:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
docker compose up -d db
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

`python -m venv`, `pip install` y `createsuperuser` solo se corren la primera vez.

La API queda en `http://127.0.0.1:8000/api/`.

> Para una prueba rápida sin MySQL, el backend acepta SQLite definiendo `$env:DB_ENGINE = "sqlite"` antes de `migrate` y `runserver`.

### 3. Levantar el frontend (React)

En otra terminal, dentro de `frontend_proyecto2_gestion_academica`:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Abrir `http://localhost:5173`.

## Variables de entorno

Archivo `.env` (copiado de `.env.example`, sin secretos):

| Variable | Valor por defecto | Para qué sirve |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Ruta base que usa React para llamar a la API. Está centralizada en `src/services/api.js`. |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:8000` | Dirección del servidor Django a la que Vite reenvía las peticiones. |

## Configuración de CORS

React corre en el puerto 5173 y Django en el 8000, así que el navegador los trata como orígenes distintos (CORS).

Para no modificar el backend del Proyecto 1, usamos el **proxy de Vite** (ver `vite.config.js`). El navegador le pide `/api/...` al mismo servidor de Vite y Vite se lo pasa a Django. Para el navegador todo viene del mismo origen, así que no aparece el error de CORS y **no hace falta instalar `django-cors-headers`**.

> Si en algún momento se quiere servir el frontend separado de Vite (por ejemplo, con `npm run build` en otro servidor), habría que agregar `django-cors-headers` al backend con `CORS_ALLOWED_ORIGINS` apuntando al dominio del frontend.

## Usuarios de prueba (ficticios)

Se crean desde `http://127.0.0.1:8000/admin/` con un superusuario. Cada usuario necesita un **Perfil de usuario** con su rol. Sugerencia para la demostración:

| Usuario | Rol | Uso en la demo |
| --- | --- | --- |
| `admin_demo` | ADMIN (superusuario) | Ve y gestiona todo |
| `profe_demo` | PROFESOR | Gestiona horarios, evaluaciones y notas de sus grupos |
| `estu_demo` | ESTUDIANTE | Solo consulta; solicita su propia matrícula |

Las contraseñas las define cada equipo en su base local y **no se suben al repositorio**.

## Autenticación y sesión

- El login hace `POST /api/token/` y guarda el token en `localStorage`.
- Cada petición envía `Authorization: Token <token>` (DRF usa el prefijo `Token`, no `Bearer`).
- La sesión se comparte entre páginas con un Context (`src/context/AuthContext.jsx`). Al iniciar sesión se consulta `GET /api/usuarios/perfil/` para saber el nombre y el rol.
- Las rutas privadas están dentro de `RutaProtegida`. Si no hay token, redirige a `/login`.
- Si Django responde **401** (token inválido), se borra el token y se vuelve al login con un aviso.
- Si responde **403**, se muestra el mensaje del servidor. Los botones se ocultan según el rol solo por comodidad: **la seguridad real la aplica Django**.

### Limitación: el token no se revoca en el servidor

El backend no tiene un endpoint de logout. Al cerrar sesión, el frontend **solo borra el token del navegador**. El token sigue siendo válido en Django hasta que un administrador lo elimine desde `/admin/` (sección *Tokens*).

## Estructura de carpetas

```
src/
├─ services/api.js        URL base, token, fetch con manejo de errores
├─ context/AuthContext.jsx  Sesión compartida (login, logout, rol)
├─ components/            Piezas reutilizables
│  ├─ Layout, BarraSuperior, MenuLateral, RutaProtegida
│  └─ Alerta, Cargando, EstadoVacio, Paginacion, ConfirmarEliminar, EncabezadoPagina
└─ pages/                 Una carpeta por módulo
   ├─ Login, Dashboard, NoEncontrado
   ├─ usuarios/   horarios/   academico/   matricula/   calificaciones/
```

## División del trabajo

| Integrante | Rama | Responsabilidad |
| --- | --- | --- |
| Fabricio | `fabricio-frontend` | Base del proyecto, login/logout, rutas protegidas, layout, componentes compartidos, Dashboard, Usuarios y Horarios |
| David | `david-academico` | Carreras, Cursos, Períodos y Grupos |
| Gabriel | `gabriel` | Matrículas, Evaluaciones y Calificaciones |

## Módulos y operaciones CRUD

| Módulo | Pantallas | Operaciones desde la interfaz |
| --- | --- | --- |
| Académico | Carreras, Cursos, Períodos, Grupos | CRUD completo en las cuatro |
| Horarios | Horarios | CRUD completo |
| Matrícula | Matrículas | CRUD completo (el estudiante solo crea la suya; editar y eliminar es del admin) |
| Calificaciones | Evaluaciones, Calificaciones | CRUD completo en las dos |
| Usuarios | Usuarios | Solo consulta |

### Por qué Usuarios es solo de consulta

El backend del Proyecto 1 solo expone dos endpoints de usuarios, los dos de lectura: `GET /api/usuarios/perfil/` (mi perfil) y `GET /api/usuarios/perfiles/` (todos, solo admin). Crear usuarios, cambiar contraseñas o asignar roles se hace en el panel `/admin/` de Django, que es donde se definió esa gestión en el Proyecto 1.

Agregar un CRUD de usuarios habría obligado a abrir endpoints nuevos para manejar contraseñas y roles, y decidimos no tocar el backend para no debilitar su seguridad. Por eso la pantalla de Usuarios muestra el perfil propio, la lista completa para el admin y sirve para demostrar el 403 con los otros roles.

## Flujos entre módulos

Los módulos dependen unos de otros, y la interfaz sigue ese orden:

1. **Estructura académica:** una **carrera** tiene **cursos**. Un curso puede tener **prerrequisitos** de la misma carrera. Cada curso se abre en **grupos** por **período lectivo**, con un **profesor** y un cupo. Cada grupo tiene sus **horarios** (día, hora y aula).
2. **Matrícula:** el estudiante elige un grupo. Antes de guardar, Django revisa que el período esté activo, que haya cupo, que no esté ya matriculado, que haya aprobado los prerrequisitos y que el horario no choque con sus otras matrículas.
3. **Calificaciones:** el profesor crea las **evaluaciones** de su grupo (entre todas no pueden pasar del 100%) y registra las **notas** de cada matrícula activa. Esas notas son las que el backend usa después para saber si un curso está aprobado (nota final de 70 o más con el 100% evaluado) y dejar matricular el siguiente.

En la interfaz esas relaciones se ven así:
- Los selectores de los formularios (carrera, curso, período, profesor, grupo, matrícula, evaluación) se llenan con datos consultados a la API.
- Las tablas muestran el nombre de lo relacionado (curso, período, profesor, estudiante) y no solo el id.
- Desde Carreras, el botón **Ver cursos** abre Cursos ya filtrado por esa carrera.

## Inventario de endpoints del backend

Todos los endpoints piden `Authorization: Token <token>`, menos `/api/token/`. Sin token o con un token inválido, Django responde **401**.

Las listas paginadas responden `{count, page, page_size, results}`. `page_size` es 10 por defecto y como máximo 50.

| Endpoint | Métodos | Permisos | Parámetros | Respuesta (campos) | Códigos |
| --- | --- | --- | --- | --- | --- |
| `/api/token/` | POST | Público | `username`, `password` (body) | `token` | 200, 400 |
| `/api/usuarios/perfil/` | GET | Cualquier usuario autenticado | — | `id`, `user {id, username, email, first_name, last_name}`, `rol`, `telefono` | 200, 401, 404 (sin perfil) |
| `/api/usuarios/perfiles/` | GET | Solo admin | — | Lista de perfiles (mismo formato, sin paginar) | 200, 401, 403 |
| `/api/academico/carreras/` | GET, POST | GET: todos · POST: admin y profesor | `search`, `ordering`, `page`, `page_size` | `id`, `codigo`, `nombre`, `descripcion` | 200, 201, 400, 401, 403 |
| `/api/academico/carreras/{id}/` | GET, PUT, PATCH, DELETE | GET: todos · PUT/PATCH: admin y profesor · DELETE: solo admin | — | Igual que arriba | 200, 204, 400, 403, 404, 409 (tiene cursos) |
| `/api/academico/cursos/` | GET, POST | GET: todos · POST: admin y profesor | `carrera`, `search`, `ordering`, `page`, `page_size` | `id`, `codigo`, `nombre`, `creditos`, `carrera`, `carrera_nombre`, `prerrequisitos[]` | 200, 201, 400, 401, 403 |
| `/api/academico/cursos/{id}/` | GET, PUT, PATCH, DELETE | GET: todos · PUT/PATCH: admin y profesor · DELETE: solo admin | — | Igual que arriba | 200, 204, 400, 403, 404 |
| `/api/academico/periodos/` | GET, POST | GET: todos · POST: admin y profesor | `search`, `ordering`, `page`, `page_size` | `id`, `nombre`, `fecha_inicio`, `fecha_fin`, `activo` | 200, 201, 400, 401, 403 |
| `/api/academico/periodos/{id}/` | GET, PUT, PATCH, DELETE | GET: todos · PUT/PATCH: admin y profesor · DELETE: solo admin | — | Igual que arriba | 200, 204, 400, 403, 404 |
| `/api/academico/grupos/` | GET, POST | GET: todos · POST: admin y profesor | `curso`, `periodo`, `search`, `ordering`, `page`, `page_size` | `id`, `curso`, `curso_nombre`, `periodo`, `periodo_nombre`, `numero_grupo`, `profesor`, `profesor_nombre`, `cupo_maximo` | 200, 201, 400, 401, 403 |
| `/api/academico/grupos/{id}/` | GET, PUT, PATCH, DELETE | GET: todos · PUT/PATCH: admin y profesor · DELETE: solo admin | — | Igual que arriba | 200, 204, 400, 403, 404 |
| `/api/horarios/` | GET, POST | GET: admin todos, profesor los de sus grupos, estudiante los de sus grupos matriculados · POST: admin o profesor del grupo | `grupo`, `dia`, `aula`, `page`, `page_size` | `id`, `grupo`, `grupo_detalle`, `dia`, `hora_inicio`, `hora_fin`, `aula` | 200, 201, 400, 401, 403 |
| `/api/horarios/{id}/` | GET, PUT, PATCH, DELETE | Ver: según lo anterior · Modificar: admin o profesor del grupo | — | Igual que arriba | 200, 204, 400, 403, 404 |
| `/api/matricula/` | GET, POST | GET: admin todas, profesor las de sus grupos, estudiante las suyas · POST: admin, o estudiante para sí mismo | `estado`, `grupo`, `search`, `page`, `page_size` | `id`, `estudiante`, `estudiante_username`, `grupo`, `grupo_detalle`, `fecha_matricula`, `estado` | 200, 201, 400, 401, 403 |
| `/api/matricula/{id}/` | GET, PUT, PATCH, DELETE | Ver: según lo anterior · Modificar y eliminar: solo admin | — | Igual que arriba | 200, 204, 400, 403, 404 |
| `/api/evaluaciones/` | GET, POST | GET: evaluaciones de los grupos que el usuario puede ver · POST: admin o profesor del grupo | `grupo`, `page`, `page_size` | `id`, `grupo`, `grupo_detalle`, `nombre`, `porcentaje` | 200, 201, 400, 401, 403 |
| `/api/evaluaciones/{id}/` | GET, PUT, PATCH, DELETE | Ver: según lo anterior · Modificar: admin o profesor del grupo | — | Igual que arriba | 200, 204, 400, 403, 404 |
| `/api/califica/{grupo_id}/validar-porcentajes/` | GET | Quien pueda ver el grupo | — | `valido`, `grupo_id`, `porcentaje_acumulado`, `porcentaje_faltante`, `porcentaje_excedido` | 200, 401, 404 |
| `/api/calificaciones/` | GET, POST | GET: admin todas, profesor las de sus grupos, estudiante las suyas · POST: admin o profesor del grupo | `matricula`, `evaluacion`, `page`, `page_size` | `id`, `matricula`, `estudiante_nombre`, `evaluacion`, `evaluacion_nombre`, `nota_obtenida` | 200, 201, 400, 401, 403 |
| `/api/calificaciones/{id}/` | GET, PUT, PATCH, DELETE | Ver: según lo anterior · Modificar: admin o profesor del grupo | — | Igual que arriba | 200, 204, 400, 403, 404 |

Formato de los errores que muestra el frontend:
- **400:** `{campo: ["mensaje"]}` o `{non_field_errors: [...]}`. Se muestra debajo de cada campo.
- **401:** `{detail: "..."}`. Se cierra la sesión y se vuelve al login.
- **403:** `{error: "..."}`. Se muestra en una alerta.
- **404:** `{detail}` o `{error}`. Se muestra en una alerta.
- **409:** `{error: "..."}`. Se muestra en una alerta, por ejemplo al eliminar una carrera con cursos.

## Matriz de pantallas y endpoints

| Pantalla | Acción en la interfaz | Método | Ruta REST |
| --- | --- | --- | --- |
| Login | Iniciar sesión | POST | `/api/token/` |
| (todas) | Cargar usuario y rol al entrar | GET | `/api/usuarios/perfil/` |
| Dashboard | Indicador de cursos | GET | `/api/academico/cursos/?page_size=1` |
| Dashboard | Indicador de grupos | GET | `/api/academico/grupos/?page_size=1` |
| Dashboard | Indicador de matrículas activas | GET | `/api/matricula/?estado=MATRICULADO&page_size=1` |
| Dashboard | Indicador de horarios | GET | `/api/horarios/?page_size=1` |
| Usuarios | Ver mi perfil | GET | `/api/usuarios/perfil/` |
| Usuarios | Ver todos los perfiles (admin) | GET | `/api/usuarios/perfiles/` |
| Horarios | Listar con filtros y paginación | GET | `/api/horarios/?grupo=&dia=&aula=&page=&page_size=` |
| Horarios | Cargar grupos para los selectores | GET | `/api/academico/grupos/?page_size=50` |
| Horarios | Crear horario | POST | `/api/horarios/` |
| Horarios | Editar horario | PATCH | `/api/horarios/{id}/` |
| Horarios | Eliminar horario | DELETE | `/api/horarios/{id}/` |
| Carreras | Listar con paginación | GET | `/api/academico/carreras/?ordering=codigo&page=&page_size=` |
| Carreras | Crear / editar carrera | POST / PATCH | `/api/academico/carreras/` · `/api/academico/carreras/{id}/` |
| Carreras | Eliminar carrera (409 si tiene cursos) | DELETE | `/api/academico/carreras/{id}/` |
| Carreras → Cursos | Ver los cursos de una carrera | GET | `/api/academico/cursos/?carrera={id}` |
| Cursos | Listar con búsqueda, filtro, orden y paginación | GET | `/api/academico/cursos/?search=&carrera=&ordering=&page=&page_size=` |
| Cursos | Cargar carreras y cursos para selectores y prerrequisitos | GET | `/api/academico/carreras/?page_size=50` · `/api/academico/cursos/?page_size=50` |
| Cursos | Crear / editar curso con prerrequisitos | POST / PATCH | `/api/academico/cursos/` · `/api/academico/cursos/{id}/` |
| Cursos | Eliminar curso | DELETE | `/api/academico/cursos/{id}/` |
| Períodos | Listar con paginación | GET | `/api/academico/periodos/?ordering=-fecha_inicio&page=&page_size=` |
| Períodos | Crear / editar período | POST / PATCH | `/api/academico/periodos/` · `/api/academico/periodos/{id}/` |
| Períodos | Eliminar período | DELETE | `/api/academico/periodos/{id}/` |
| Grupos | Listar con filtros combinables y paginación | GET | `/api/academico/grupos/?curso=&periodo=&page=&page_size=` |
| Grupos | Cargar profesores para el selector (admin) | GET | `/api/usuarios/perfiles/` |
| Grupos | Crear / editar grupo | POST / PATCH | `/api/academico/grupos/` · `/api/academico/grupos/{id}/` |
| Grupos | Eliminar grupo | DELETE | `/api/academico/grupos/{id}/` |

## Módulos Matrícula y Calificaciones (parte de Gabriel)

### Pantallas y endpoints

| Pantalla | Acción en la interfaz | Método | Ruta REST |
| --- | --- | --- | --- |
| Matrículas | Listar con filtros combinables y paginación | GET | `/api/matricula/?estado=&grupo=&search=&page=&page_size=` |
| Matrículas | Cargar grupos para el selector | GET | `/api/academico/grupos/?page_size=50` |
| Matrículas | Cargar estudiantes para el selector (admin) | GET | `/api/usuarios/perfiles/` |
| Matrículas | Solicitar matrícula (estudiante) / registrar (admin) | POST | `/api/matricula/` |
| Matrículas | Editar estado o grupo (admin) | PATCH | `/api/matricula/{id}/` |
| Matrículas | Eliminar matrícula (admin) | DELETE | `/api/matricula/{id}/` |
| Evaluaciones | Listar por grupo con paginación | GET | `/api/evaluaciones/?grupo=&page=&page_size=` |
| Evaluaciones | Crear / editar evaluación | POST / PATCH | `/api/evaluaciones/` · `/api/evaluaciones/{id}/` |
| Evaluaciones | Eliminar evaluación | DELETE | `/api/evaluaciones/{id}/` |
| Evaluaciones | Validar que los porcentajes sumen 100% | GET | `/api/califica/{grupo_id}/validar-porcentajes/` |
| Calificaciones | Listar con filtros combinables y paginación | GET | `/api/calificaciones/?matricula=&evaluacion=&page=&page_size=` |
| Calificaciones | Cargar matrículas y evaluaciones para los selectores | GET | `/api/matricula/?page_size=50` · `/api/evaluaciones/?page_size=50` |
| Calificaciones | Registrar / editar nota | POST / PATCH | `/api/calificaciones/` · `/api/calificaciones/{id}/` |
| Calificaciones | Eliminar nota | DELETE | `/api/calificaciones/{id}/` |

### Permisos

| Acción | Admin | Profesor | Estudiante |
| --- | --- | --- | --- |
| Ver matrículas | Todas | Las de sus grupos | Solo las suyas |
| Crear matrícula | Sí (elige estudiante) | No (403) | Sí, solo para sí mismo |
| Editar / eliminar matrícula | Sí | No (403) | No (403) |
| Ver evaluaciones y notas | Todas | Las de sus grupos | Las de sus grupos / sus notas |
| Crear, editar y eliminar evaluaciones y notas | Sí | Solo en grupos que imparte | No (403) |

### Escenarios de prueba manual

| # | Escenario | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| M1 | Solicitar matrícula | Como estudiante: Matrículas → Solicitar matrícula → elegir grupo | Alerta de éxito y aparece en "Mis matrículas" |
| M2 | Prerrequisito pendiente | Como estudiante, matricular un curso cuyo prerrequisito no aprobó | Django rechaza: "no ha aprobado todos los prerrequisitos" |
| M3 | Matrícula duplicada | Matricular dos veces el mismo grupo | Mensaje "ya tiene una matrícula registrada para ese grupo" |
| M4 | Retirar matrícula | Como admin, editar una matrícula y poner estado Retirado | La tabla muestra la etiqueta "Retirado" |
| M5 | Filtros combinables | Filtrar por grupo y estado a la vez | Solo aparecen las matrículas que cumplen ambos (filtrado en el backend) |
| M6 | Permisos de matrícula | Como profesor entrar a Matrículas | Solo ve las de sus grupos y no tiene botones de acción |
| E1 | Crear evaluación | Como profesor: Nueva evaluación en su grupo, 40% | Alerta de éxito |
| E2 | Porcentaje excedido | Agregar otra evaluación que haga pasar la suma de 100% | Django rechaza indicando el total que quedaría |
| E3 | Validar porcentajes | Elegir el grupo y presionar "Validar porcentajes del grupo" | Barra con el porcentaje acumulado y aviso si falta |
| C1 | Registrar nota | Calificaciones → Registrar nota → estudiante, evaluación y nota | Aparece en la tabla con etiqueta verde (≥ 70) o roja |
| C2 | Nota fuera de rango | Escribir 120 en la nota | Mensaje "La nota debe estar entre 0 y 100" y no se envía |
| C3 | Notas del estudiante | Entrar como estudiante a Calificaciones | Ve "Mis calificaciones" solo con sus notas y sin botones |

## Matriz de perfiles y permisos (Dashboard, Usuarios y Horarios)

Los permisos de los demás módulos están en la sección de cada uno: Matrícula y Calificaciones más arriba, y Académico más abajo.

| Pantalla / acción | Admin | Profesor | Estudiante |
| --- | --- | --- | --- |
| Dashboard | Ve todo | Ve datos de sus grupos | Ve sus matrículas y horarios |
| Usuarios: mi perfil | Sí | Sí | Sí |
| Usuarios: todos los perfiles | Sí | 403 | 403 |
| Horarios: consultar | Todos | Los de sus grupos | Los de sus grupos matriculados |
| Horarios: crear / editar / eliminar | Sí | Solo en grupos que imparte (si no, 403) | No (403) |

## Escenarios de prueba manual (parte de Fabricio)

| # | Escenario | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| 1 | Login correcto | Entrar con un usuario válido | Redirige al Dashboard y muestra nombre y rol arriba |
| 2 | Login incorrecto | Contraseña equivocada | Alerta "Usuario o contraseña incorrectos" |
| 3 | Ruta protegida sin sesión | Abrir `/horarios` sin haber iniciado sesión | Redirige a `/login` y, después de entrar, vuelve a `/horarios` |
| 4 | Logout | Botón "Salir" | Borra el token de `localStorage` y vuelve al login |
| 5 | Token inválido (401) | Cambiar el token en `localStorage` y recargar | Vuelve al login con el aviso de sesión expirada |
| 6 | Acceso denegado (403) | Como estudiante, en Usuarios presionar "Intentar consultar perfiles" | Alerta "Error 403: No tiene permisos..." |
| 7 | Validación en el cliente | Guardar un horario vacío | Mensajes debajo de cada campo obligatorio |
| 8 | Validación del servidor | Crear un horario en un aula ocupada a la misma hora | Django responde 400 y el error aparece debajo del campo Aula |
| 9 | Crear horario | Llenar el formulario y guardar | Alerta de éxito y la tabla se actualiza |
| 10 | Editar horario | Botón Editar | El formulario se precarga; al actualizar se refleja en la tabla |
| 11 | Eliminar horario | Botón Eliminar y confirmar | Pide confirmación, elimina y actualiza la tabla |
| 12 | Filtros combinables | Filtrar por grupo y día a la vez | Solo aparecen los horarios que cumplen ambos filtros (filtrado en el backend) |
| 13 | Paginación | Con más de 10 horarios, cambiar de página | Se piden `page=2` al backend y cambia el texto "Mostrando..." |
| 14 | Diseño adaptable | Abrir en celular o con la ventana angosta | El menú se oculta y se abre con el botón ☰ |
| 15 | Servidor apagado | Detener Django y recargar una lista | Mensaje "No se pudo conectar con el servidor" |

## Módulo Académico (parte de David)

### Permisos

| Acción en Carreras, Cursos, Períodos y Grupos | Admin | Profesor | Estudiante |
| --- | --- | --- | --- |
| Consultar | Sí | Sí | Sí |
| Crear y editar | Sí | Sí | No (403) |
| Eliminar | Sí | No (403) | No (403) |

Los botones se muestran según el rol, pero quien decide es Django. Por ejemplo, un `DELETE` de un profesor a `/api/academico/grupos/{id}/` responde 403.

### Escenarios de prueba manual

| # | Escenario | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| A1 | Crear carrera | Carreras → Nueva carrera → código y nombre → Guardar | Alerta de éxito y aparece en la tabla |
| A2 | Código duplicado | Crear una carrera con un código que ya existe | Django responde 400 y el error aparece debajo de Código |
| A3 | Conflicto al eliminar (409) | Eliminar una carrera que tiene cursos | Mensaje "No se puede eliminar una carrera que tiene cursos asociados" |
| A4 | Relación carrera → cursos | En Carreras presionar "Ver cursos" | Abre Cursos con el filtro de esa carrera ya aplicado |
| A5 | Búsqueda | En Cursos buscar "datos" | Solo aparecen cursos cuyo código o nombre contiene el texto (filtrado en el backend) |
| A6 | Ordenamiento | En Cursos elegir "Más créditos" | La tabla se ordena con `?ordering=-creditos` |
| A7 | Prerrequisitos | Editar un curso y marcar otro curso de la misma carrera | Se guarda y la columna Prerrequisitos muestra su código |
| A8 | Ciclo de prerrequisitos | Marcar como prerrequisito un curso que ya depende del actual | Django rechaza con "La relación crea un ciclo de prerrequisitos" |
| A9 | Validación de fechas | Período con fecha de fin anterior a la de inicio | Mensaje debajo de Fecha de fin y no se envía |
| A10 | Grupo duplicado | Crear un grupo con el mismo curso, período y número | Mensaje "deben formar un conjunto único" |
| A11 | Filtros combinables | En Grupos filtrar por curso y período | Solo aparecen los grupos que cumplen ambos filtros |
| A12 | Permisos por rol | Entrar como profesor y como estudiante | El profesor no ve Eliminar; el estudiante solo consulta |

## Capturas

Tomadas con la aplicación corriendo contra el backend real (rama `main`). Los datos se cargaron por medio de la API, así que pasaron por todas las validaciones de Django. Los usuarios y nombres son ficticios. Las imágenes están en la carpeta [`capturas/`](capturas/).

### Login y dashboard

| Captura | Qué muestra |
| --- | --- |
| [01-login](capturas/01-login.png) | Pantalla de login con usuario y contraseña |
| [02-login-incorrecto](capturas/02-login-incorrecto.png) | Error al entrar con una contraseña equivocada |
| [03-dashboard-admin](capturas/03-dashboard-admin.png) | Dashboard del administrador con indicadores de la API y accesos a los cinco módulos |
| [18-dashboard-profesor](capturas/18-dashboard-profesor.png) | Dashboard del profesor (los indicadores cambian según el rol) |
| [23-dashboard-estudiante](capturas/23-dashboard-estudiante.png) | Dashboard del estudiante |

### Módulos

| Captura | Qué muestra |
| --- | --- |
| [04-usuarios-admin](capturas/04-usuarios-admin.png) | Usuarios: mi perfil y la lista de todos los perfiles (admin) |
| [05-carreras](capturas/05-carreras.png) | Carreras: listado con acciones y paginación |
| [08-cursos-busqueda-orden](capturas/08-cursos-busqueda-orden.png) | Cursos: búsqueda "programación" ordenada por créditos (filtrado en el backend) |
| [09-curso-formulario-prerrequisitos](capturas/09-curso-formulario-prerrequisitos.png) | Formulario de edición precargado, con selector de carrera y prerrequisitos |
| [10-periodos](capturas/10-periodos.png) | Períodos lectivos activos e inactivos |
| [12-grupos-filtros-combinados](capturas/12-grupos-filtros-combinados.png) | Grupos filtrados por curso y período a la vez |
| [14-horarios](capturas/14-horarios.png) | Horarios con filtros por grupo, día y aula |
| [17-matriculas-admin](capturas/17-matriculas-admin.png) | Matrículas con su estado (matriculado / retirado) |
| [19-evaluaciones-validar-porcentajes](capturas/19-evaluaciones-validar-porcentajes.png) | Evaluaciones de un grupo y validación de porcentajes (falta 10% para el 100%) |
| [21-calificaciones-profesor](capturas/21-calificaciones-profesor.png) | Calificaciones de los grupos del profesor |
| [22-grupos-vista-profesor](capturas/22-grupos-vista-profesor.png) | Grupos vistos por un profesor: puede editar pero no ve Eliminar |
| [25-calificaciones-estudiante](capturas/25-calificaciones-estudiante.png) | El estudiante solo ve sus propias notas |

### Validaciones, errores y permisos

| Captura | Qué muestra |
| --- | --- |
| [06-confirmar-eliminar](capturas/06-confirmar-eliminar.png) | Confirmación antes de borrar |
| [07-carrera-error-409](capturas/07-carrera-error-409.png) | Error 409 al eliminar una carrera que tiene cursos |
| [11-periodo-validacion-fechas](capturas/11-periodo-validacion-fechas.png) | Validación en el cliente: fecha de fin anterior a la de inicio |
| [13-grupo-error-servidor-duplicado](capturas/13-grupo-error-servidor-duplicado.png) | Error 400 del servidor: grupo duplicado |
| [15-horario-validacion-cliente](capturas/15-horario-validacion-cliente.png) | Validación en el cliente: campos obligatorios vacíos |
| [16-horario-error-aula-ocupada](capturas/16-horario-error-aula-ocupada.png) | Error 400 del servidor mostrado debajo del campo Aula |
| [20-evaluacion-error-supera-100](capturas/20-evaluacion-error-supera-100.png) | Regla de negocio: las evaluaciones de un grupo no pueden pasar del 100% |
| [24-matricula-error-prerrequisito](capturas/24-matricula-error-prerrequisito.png) | Regla de negocio: no se puede matricular sin aprobar los prerrequisitos |
| [26-error-403-sin-permisos](capturas/26-error-403-sin-permisos.png) | Error 403: un estudiante intenta consultar todos los perfiles |

### Diseño adaptable

| Captura | Qué muestra |
| --- | --- |
| [27-movil-dashboard](capturas/27-movil-dashboard.png) | Dashboard en un celular |
| [28-movil-menu](capturas/28-movil-menu.png) | Menú abierto con el botón ☰ en el celular |
