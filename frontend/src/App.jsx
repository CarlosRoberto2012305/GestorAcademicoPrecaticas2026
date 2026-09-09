import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function App() {
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
  const isLoggedIn = Boolean(session);
  const isStudent = session?.rol === 'estudiante';
  const canViewUsers = ['admin', 'profesor'].includes(session?.rol);
  const canViewComments = ['admin', 'profesor'].includes(session?.rol);
  const visiblePosts = session?.rol === 'admin' && selectedProfessorId
    ? posts.filter((post) => String(post.destinatarioId) === String(selectedProfessorId))
    : posts;

  const fetchData = async () => {
    const token = localStorage.getItem('gestor-academico-token');
    const authConfig = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    const results = await Promise.allSettled([
      axios.get(`${API_URL}/health`),
      axios.get(`${API_URL}/courses`, authConfig),
      axios.get(`${API_URL}/grades`, authConfig),
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
          {!isLoggedIn ? (
            <p className="locked-message">Debes iniciar sesión para ver tus cursos asignados.</p>
          ) : courses.length ? (
            <table>
              <thead>
                <tr><th>Nombre</th><th>Código</th><th>Créditos</th></tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.nombre}</td>
                    <td>{course.codigo}</td>
                    <td>{course.creditos}</td>
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
          {users.length ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nombre}</td>
                    <td>{user.email}</td>
                    <td>{user.rol}</td>
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
                  </tr>
                </thead>
                <tbody>
                  {visiblePosts.map((post) => (
                    <tr key={post.id}>
                      <td>{post.course?.nombre || '---'}</td>
                      <td>{post.autor?.nombre || '---'}</td>
                      <td>{post.titulo}</td>
                      <td>{post.contenido}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hay comentarios dirigidos a ti.</p>
            )}
          </section>
        )}

        <section className={`panel wide ${!isLoggedIn ? 'locked-panel' : ''}`}>
          <h2>Calificaciones</h2>
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
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay calificaciones.</p>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
