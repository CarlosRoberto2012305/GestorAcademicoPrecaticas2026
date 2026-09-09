import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function App() {
  // Datos consultados al backend. Cada tabla se actualiza con el intervalo de polling.
  const [health, setHealth] = useState(null);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedProfessorId, setSelectedProfessorId] = useState('');
  const [session, setSession] = useState(() => {
    const savedUser = localStorage.getItem('gestor-academico-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentData, setCommentData] = useState({
    titulo: '',
    contenido: '',
    destinatarioId: '',
    courseId: '',
  });
  const [commentMessage, setCommentMessage] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingGradeId, setEditingGradeId] = useState(null);
  const [userForm, setUserForm] = useState({ nombre: '', email: '', password: '', rol: 'estudiante' });
  const [courseForm, setCourseForm] = useState({ nombre: '', codigo: '', descripcion: '', creditos: 1 });
  const [gradeForm, setGradeForm] = useState({ score: '', periodo: '2026-1', comentario: '', courseId: '', studentId: '' });

  // Estos valores controlan qué paneles y acciones se muestran según el rol autenticado.
  const isLoggedIn = Boolean(session);
  const isStudent = session?.rol === 'estudiante';
  const canViewUsers = ['admin', 'profesor'].includes(session?.rol);
  const canViewComments = ['admin', 'profesor'].includes(session?.rol);
  const isAdmin = session?.rol === 'admin';
  const canManageAcademic = isAdmin;
  const canManageUsers = ['admin', 'profesor'].includes(session?.rol);
  const canViewGrades = ['admin', 'profesor', 'estudiante'].includes(session?.rol);
  const canEditGrades = ['admin', 'profesor'].includes(session?.rol);
  const canCreateGrades = isAdmin;
  const visiblePosts = session?.rol === 'admin' && selectedProfessorId
    ? posts.filter((post) => String(post.destinatarioId) === String(selectedProfessorId))
    : posts;

  const fetchData = async () => {
    // El token se agrega solo a las peticiones protegidas; health permanece público.
    const token = localStorage.getItem('gestor-academico-token');
    const authConfig = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    const results = await Promise.allSettled([
      axios.get(`${API_URL}/health`),
      axios.get(`${API_URL}/courses`, authConfig),
      canViewGrades ? axios.get(`${API_URL}/grades`, authConfig) : Promise.resolve({ data: { grades: [] } }),
      axios.get(`${API_URL}/users`),
      axios.get(`${API_URL}/users/professors`, authConfig),
      axios.get(`${API_URL}/posts`, authConfig),
    ]);

    const [healthResult, coursesResult, gradesResult, usersResult, professorsResult, postsResult] = results;

    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value.data);
    } else {
      setHealth(null);
    }

    if (coursesResult.status === 'fulfilled') {
      setCourses(coursesResult.value.data.courses || []);
    }

    if (gradesResult.status === 'fulfilled') {
      setGrades(gradesResult.value.data.grades || []);
    }

    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value.data.users || []);
    }

    if (professorsResult.status === 'fulfilled') {
      setProfessors(professorsResult.value.data.professors || []);
    }

    if (postsResult.status === 'fulfilled') {
      setPosts(postsResult.value.data.posts || []);
    }

    const protectedResourceFailed = [coursesResult, gradesResult, usersResult, professorsResult, postsResult]
      .some((result) => result.status === 'rejected' && result.reason?.response?.status === 401);

    if (healthResult.status === 'rejected') {
      setError('No se pudo conectar con el backend.');
    } else if (protectedResourceFailed) {
      setError('Inicia sesión para consultar la información protegida.');
    } else {
      setError('');
    }

    setLoading(false);
  };

  const handleCommentSubmit = async (event) => {
    // El formulario de comentarios solo aparece para estudiantes.
    event.preventDefault();
    setCommentLoading(true);
    setCommentMessage('');

    try {
      const token = localStorage.getItem('gestor-academico-token');
      await axios.post(`${API_URL}/posts`, commentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCommentData({ titulo: '', contenido: '', destinatarioId: '', courseId: '' });
      setCommentMessage('Comentario enviado al profesor.');
      await fetchData();
    } catch (err) {
      setCommentMessage(err.response?.data?.message || 'No se pudo enviar el comentario.');
    } finally {
      setCommentLoading(false);
    }
  };

  const adminRequest = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('gestor-academico-token')}` },
  });

  const handleAdminSubmit = async (event, type) => {
    // Un único handler sirve para los formularios de usuarios, cursos y calificaciones.
    event.preventDefault();
    setAdminMessage('');
    const configs = {
      user: { path: '/users', form: userForm, id: editingUserId, setForm: setUserForm, empty: { nombre: '', email: '', password: '', rol: 'estudiante' } },
      course: { path: '/courses', form: courseForm, id: editingCourseId, setForm: setCourseForm, empty: { nombre: '', codigo: '', descripcion: '', creditos: 1 } },
      grade: { path: '/grades', form: gradeForm, id: editingGradeId, setForm: setGradeForm, empty: { score: '', periodo: '2026-1', comentario: '', courseId: '', studentId: '' } },
    };
    const config = configs[type];

    try {
      const url = `${API_URL}${config.path}${config.id ? `/${config.id}` : ''}`;
      if (config.id) await axios.put(url, config.form, adminRequest());
      else await axios.post(url, config.form, adminRequest());
      config.setForm(config.empty);
      if (type === 'user') setEditingUserId(null);
      if (type === 'course') setEditingCourseId(null);
      if (type === 'grade') setEditingGradeId(null);
      setAdminMessage('Información guardada correctamente.');
      await fetchData();
    } catch (err) {
      setAdminMessage(err.response?.data?.message || 'No se pudo guardar la información.');
    }
  };

  const handleAdminDelete = async (type, id) => {
    // Las eliminaciones se ejecutan en la API y luego se vuelve a consultar la información.
    const paths = { user: '/users', course: '/courses', grade: '/grades', post: '/posts' };
    try {
      await axios.delete(`${API_URL}${paths[type]}/${id}`, adminRequest());
      setAdminMessage('Información eliminada correctamente.');
      await fetchData();
    } catch (err) {
      setAdminMessage(err.response?.data?.message || 'No se pudo eliminar la información.');
    }
  };

  const editUser = (user) => {
    setEditingUserId(user.id);
    setUserForm({ nombre: user.nombre, email: user.email, password: '', rol: user.rol });
  };

  const editCourse = (course) => {
    setEditingCourseId(course.id);
    setCourseForm({ nombre: course.nombre, codigo: course.codigo, descripcion: course.descripcion || '', creditos: course.creditos });
  };

  const editGrade = (grade) => {
    setEditingGradeId(grade.id);
    setGradeForm({ score: grade.score, periodo: grade.periodo, comentario: grade.comentario || '', courseId: grade.courseId, studentId: grade.studentId });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginLoading(true);
    setLoginMessage('');
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      const { token, user } = response.data;

      localStorage.setItem('gestor-academico-token', token);
      localStorage.setItem('gestor-academico-user', JSON.stringify(user));
      setSession(user);
      setLoginData({ email: '', password: '' });
      setLoginMessage(`Sesion iniciada como ${user.nombre}.`);
      await fetchData();
    } catch (err) {
      setLoginMessage(err.response?.data?.message || 'No se pudo iniciar sesion.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gestor-academico-token');
    localStorage.removeItem('gestor-academico-user');
    setSession(null);
    setCourses([]);
    setGrades([]);
    setProfessors([]);
    setPosts([]);
    setSelectedProfessorId('');
    setLoginMessage('Sesion cerrada.');
  };

  useEffect(() => {
    // Polling sencillo para mantener el dashboard sincronizado sin recargar la página.
    const initialFetch = setTimeout(fetchData, 0);

    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Panel en tiempo real</h1>
        <span className={`status ${health?.ok ? 'online' : 'offline'}`}>
          {health?.ok ? 'Backend activo' : 'Sin conexión'}
        </span>
      </header>

      {loading && <p className="loading">Cargando datos...</p>}
      {error && <p className="error">{error}</p>}
      {adminMessage && <p className="success">{adminMessage}</p>}

      <main className="grid">
        <section className="panel auth-panel wide">
          <div className="auth-heading">
            <div>
              <h2>Acceso de usuario</h2>
              <p>Inicia sesion para consultar cursos y calificaciones.</p>
            </div>
            {session && (
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Cerrar sesion
              </button>
            )}
          </div>

          {session ? (
            <p className="success">Sesion activa: {session.nombre} ({session.rol})</p>
          ) : (
            <form className="login-form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(event) => setLoginData({ ...loginData, email: event.target.value })}
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </label>
              <label>
                Contrasena
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(event) => setLoginData({ ...loginData, password: event.target.value })}
                  placeholder="Tu contrasena"
                  required
                />
              </label>
              <button type="submit" disabled={loginLoading}>
                {loginLoading ? 'Ingresando...' : 'Iniciar sesion'}
              </button>
            </form>
          )}
          {loginMessage && <p className={session ? 'success' : 'error'}>{loginMessage}</p>}
        </section>

        <section className={`panel ${!isLoggedIn ? 'locked-panel' : ''}`}>
          <h2>Estado general</h2>
          {!isLoggedIn ? (
            <p className="locked-message">Inicia sesión para consultar el panel académico.</p>
          ) : health ? (
            <pre>{JSON.stringify(health, null, 2)}</pre>
          ) : (
            <p>Sin respuesta del backend.</p>
          )}
        </section>

        <section className={`panel ${!isLoggedIn ? 'locked-panel' : ''}`}>
          <h2>Cursos</h2>
          {(canCreateGrades || editingGradeId) && (
            <form className="admin-form" onSubmit={(event) => handleAdminSubmit(event, 'course')}>
              <input placeholder="Nombre" value={courseForm.nombre} onChange={(event) => setCourseForm({ ...courseForm, nombre: event.target.value })} required />
              <input placeholder="Código" value={courseForm.codigo} onChange={(event) => setCourseForm({ ...courseForm, codigo: event.target.value.toUpperCase() })} required />
              <input type="number" min="1" max="20" placeholder="Créditos" value={courseForm.creditos} onChange={(event) => setCourseForm({ ...courseForm, creditos: event.target.value })} required />
              <input placeholder="Descripción" value={courseForm.descripcion} onChange={(event) => setCourseForm({ ...courseForm, descripcion: event.target.value })} />
              <button type="submit">{editingCourseId ? 'Actualizar curso' : 'Agregar curso'}</button>
            </form>
          )}
          {!isLoggedIn ? (
            <p className="locked-message">Debes iniciar sesión para ver tus cursos asignados.</p>
          ) : courses.length ? (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th><th>Código</th><th>Créditos</th>
                  {isStudent && <th>Catedrático</th>}
                  {canManageAcademic && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.nombre}</td>
                    <td>{course.codigo}</td>
                    <td>{course.creditos}</td>
                    {isStudent && <td>{course.catedraticos?.map((professor) => professor.nombre).join(', ') || 'Sin asignar'}</td>}
                    {canManageAcademic && (
                      <td className="actions">
                        <button type="button" onClick={() => editCourse(course)}>Editar</button>
                        <button type="button" className="danger-button" onClick={() => handleAdminDelete('course', course.id)}>Eliminar</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay cursos.</p>
          )}
        </section>

        {canViewUsers && (
        <section className="panel wide">
          <h2>Usuarios</h2>
          {canManageUsers && (
            <form className="admin-form" onSubmit={(event) => handleAdminSubmit(event, 'user')}>
              <input placeholder="Nombre" value={userForm.nombre} onChange={(event) => setUserForm({ ...userForm, nombre: event.target.value })} required />
              <input type="email" placeholder="Email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required />
              <input type="password" placeholder={editingUserId ? 'Nueva contraseña (opcional)' : 'Contraseña'} value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} required={!editingUserId} />
              {isAdmin ? (
                <select value={userForm.rol} onChange={(event) => setUserForm({ ...userForm, rol: event.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="profesor">Profesor</option>
                  <option value="estudiante">Estudiante</option>
                </select>
              ) : <span className="role-hint">Nuevo usuario: alumno</span>}
              <button type="submit">{editingUserId ? 'Actualizar usuario' : 'Agregar usuario'}</button>
            </form>
          )}
          {users.length ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  {canManageUsers && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nombre}</td>
                    <td>{user.email}</td>
                    <td>{user.rol}</td>
                    {canManageUsers && (
                      <td className="actions">
                        <button type="button" onClick={() => editUser(user)}>Editar</button>
                        <button type="button" className="danger-button" onClick={() => handleAdminDelete('user', user.id)}>Eliminar</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay usuarios.</p>
          )}
        </section>
        )}

        {isStudent && (
          <section className="panel wide">
            <h2>Comentario para el profesor</h2>
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <label>
                Profesor
                <select
                  value={commentData.destinatarioId}
                  onChange={(event) => setCommentData({ ...commentData, destinatarioId: event.target.value })}
                  required
                >
                  <option value="">Selecciona un profesor</option>
                  {professors.map((professor) => (
                    <option key={professor.id} value={professor.id}>{professor.nombre}</option>
                  ))}
                </select>
              </label>
              <label>
                Curso asignado
                <select
                  value={commentData.courseId}
                  onChange={(event) => setCommentData({ ...commentData, courseId: event.target.value })}
                  required
                >
                  <option value="">Selecciona un curso</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.nombre}</option>
                  ))}
                </select>
              </label>
              <label>
                Titulo
                <input
                  value={commentData.titulo}
                  onChange={(event) => setCommentData({ ...commentData, titulo: event.target.value })}
                  required
                />
              </label>
              <label>
                Comentario
                <textarea
                  value={commentData.contenido}
                  onChange={(event) => setCommentData({ ...commentData, contenido: event.target.value })}
                  rows="3"
                  required
                />
              </label>
              <button type="submit" disabled={commentLoading}>
                {commentLoading ? 'Enviando...' : 'Enviar comentario'}
              </button>
            </form>
            {commentMessage && <p className={commentMessage.includes('enviado') ? 'success' : 'error'}>{commentMessage}</p>}
          </section>
        )}

        {canViewComments && (
          <section className="panel wide">
            <div className="section-heading">
              <div>
                <h2>{session.rol === 'admin' ? 'Comentarios por profesor' : 'Comentarios de mis estudiantes'}</h2>
                {session.rol === 'admin' && <p>Selecciona un profesor para consultar todos sus comentarios.</p>}
              </div>
              {session.rol === 'admin' && (
                <select
                  value={selectedProfessorId}
                  onChange={(event) => setSelectedProfessorId(event.target.value)}
                >
                  <option value="">Todos los profesores</option>
                  {professors.map((professor) => (
                    <option key={professor.id} value={professor.id}>{professor.nombre}</option>
                  ))}
                </select>
              )}
            </div>
            {visiblePosts.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Estudiante</th>
                    <th>Titulo</th>
                    <th>Comentario</th>
                    {isAdmin && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {visiblePosts.map((post) => (
                    <tr key={post.id}>
                      <td>{post.course?.nombre || '---'}</td>
                      <td>{post.autor?.nombre || '---'}</td>
                      <td>{post.titulo}</td>
                      <td>{post.contenido}</td>
                      {isAdmin && (
                        <td className="actions">
                          <button type="button" className="danger-button" onClick={() => handleAdminDelete('post', post.id)}>Eliminar</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay comentarios dirigidos a ti.</p>
            )}
          </section>
        )}

        {canViewGrades && <section className={`panel wide ${!isLoggedIn ? 'locked-panel' : ''}`}>
          <h2>Calificaciones</h2>
          {canManageAcademic && (
            <form className="admin-form" onSubmit={(event) => handleAdminSubmit(event, 'grade')}>
              <input type="number" min="0" max="100" step="0.01" placeholder="Nota" value={gradeForm.score} onChange={(event) => setGradeForm({ ...gradeForm, score: event.target.value })} required />
              <input placeholder="Periodo: 2026-1" value={gradeForm.periodo} onChange={(event) => setGradeForm({ ...gradeForm, periodo: event.target.value })} required />
              <select value={gradeForm.courseId} onChange={(event) => setGradeForm({ ...gradeForm, courseId: event.target.value })} required>
                <option value="">Curso</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.nombre}</option>)}
              </select>
              <select value={gradeForm.studentId} onChange={(event) => setGradeForm({ ...gradeForm, studentId: event.target.value })} required>
                <option value="">Estudiante</option>
                {users.filter((user) => user.rol === 'estudiante').map((user) => <option key={user.id} value={user.id}>{user.nombre}</option>)}
              </select>
              <input placeholder="Comentario" value={gradeForm.comentario} onChange={(event) => setGradeForm({ ...gradeForm, comentario: event.target.value })} />
              <button type="submit">{editingGradeId ? 'Actualizar nota' : 'Agregar nota'}</button>
            </form>
          )}
          {!isLoggedIn ? (
            <p className="locked-message">Inicia sesión para consultar tus calificaciones.</p>
          ) : grades.length ? (
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Curso</th>
                  <th>Periodo</th>
                  <th>Nota</th>
                  {isStudent && <th>Comentario del profesor</th>}
                  {canEditGrades && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id}>
                    <td>{grade.student?.nombre || '---'}</td>
                    <td>{grade.course?.nombre || '---'}</td>
                    <td>{grade.periodo}</td>
                    <td>{grade.score}</td>
                    {isStudent && <td>{grade.comentario || 'Sin comentario'}</td>}
                    {canEditGrades && (
                      <td className="actions">
                        <button type="button" onClick={() => editGrade(grade)}>Editar</button>
                        {isAdmin && <button type="button" className="danger-button" onClick={() => handleAdminDelete('grade', grade.id)}>Eliminar</button>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay calificaciones.</p>
          )}
        </section>}
      </main>
    </div>
  );
}

export default App;
