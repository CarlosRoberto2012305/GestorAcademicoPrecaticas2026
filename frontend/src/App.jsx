import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

function App() {
  const [health, setHealth] = useState(null);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    const results = await Promise.allSettled([
      axios.get(`${API_URL}/health`),
      axios.get(`${API_URL}/courses`),
      axios.get(`${API_URL}/grades`),
      axios.get(`${API_URL}/users`),
    ]);

    const [healthResult, coursesResult, gradesResult, usersResult] = results;

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

    const protectedResourceFailed = [coursesResult, gradesResult]
      .some((result) => result.status === 'rejected' && result.reason?.response?.status === 401);

    if (healthResult.status === 'rejected') {
      setError('No se pudo conectar con el backend.');
    } else if (protectedResourceFailed) {
      setError('Cursos y calificaciones requieren iniciar sesión.');
    } else {
      setError('');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
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
        <section className="panel">
          <h2>Estado general</h2>
          {health ? (
            <pre>{JSON.stringify(health, null, 2)}</pre>
          ) : (
            <p>Sin respuesta del backend.</p>
          )}
        </section>

        <section className="panel">
          <h2>Cursos</h2>
          {courses.length ? (
            <ul>
              {courses.map((course) => (
                <li key={course.id}>
                  <strong>{course.nombre}</strong> - {course.codigo}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay cursos.</p>
          )}
        </section>

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

        <section className="panel wide">
          <h2>Calificaciones</h2>
          {grades.length ? (
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Curso</th>
                  <th>Periodo</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => (
                  <tr key={grade.id}>
                    <td>{grade.student?.nombre || '---'}</td>
                    <td>{grade.course?.nombre || '---'}</td>
                    <td>{grade.periodo}</td>
                    <td>{grade.score}</td>
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
