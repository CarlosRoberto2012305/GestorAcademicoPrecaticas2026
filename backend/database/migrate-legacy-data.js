const { sequelize, User, Course, Grade, Post } = require('../src/models');

async function ensureCompatibilityColumns() {
  const additions = [
    ['Usuario', 'rol', "ALTER TABLE Usuario ADD COLUMN rol ENUM('admin', 'profesor', 'estudiante') NOT NULL DEFAULT 'estudiante'"],
    ['Catedratico', 'id_usuario', 'ALTER TABLE Catedratico ADD COLUMN id_usuario INT NULL UNIQUE'],
    ['Publicacion', 'titulo', 'ALTER TABLE Publicacion ADD COLUMN titulo VARCHAR(150) NULL'],
  ];

  for (const [table, column, statement] of additions) {
    const [columns] = await sequelize.query(`DESCRIBE ${table}`);
    if (!columns.some((item) => item.Field === column)) {
      await sequelize.query(statement);
    }
  }
}

async function insertId(sql, replacements) {
  const [result, metadata] = await sequelize.query(sql, { replacements });
  return result?.insertId || metadata?.insertId;
}

async function migrate() {
  await ensureCompatibilityColumns();
  const [legacyUsers] = await sequelize.query('SELECT * FROM usuarios ORDER BY id');
  const [legacyCourses] = await sequelize.query('SELECT * FROM cursos ORDER BY id');
  const [legacyGrades] = await sequelize.query('SELECT * FROM calificaciones ORDER BY id');
  const [legacyPosts] = await sequelize.query('SELECT * FROM publicaciones ORDER BY id');

  const personByLegacyUser = new Map();
  const userByLegacyUser = new Map();
  const professorByLegacyUser = new Map();
  const courseByLegacyCourse = new Map();

  for (const user of legacyUsers) {
    const [existingPerson] = await sequelize.query(
      'SELECT id_persona FROM Persona WHERE correo_electronico = ? LIMIT 1',
      { replacements: [user.email] }
    );
    const personId = existingPerson[0]?.id_persona || await insertId(
      'INSERT INTO Persona (nombres, apellidos, correo_electronico) VALUES (?, ?, ?)',
      [user.nombre, '', user.email]
    );

    const resolvedPersonId = personId;
    personByLegacyUser.set(user.id, resolvedPersonId);

    const [existingAccount] = await sequelize.query(
      'SELECT id_usuario FROM Usuario WHERE id_persona = ? LIMIT 1',
      { replacements: [resolvedPersonId] }
    );
    const accountId = existingAccount[0]?.id_usuario || await insertId(
      'INSERT INTO Usuario (id_persona, registro_academico, nombre_usuario, contrasena, rol) VALUES (?, ?, ?, ?, ?)',
      [resolvedPersonId, `LEGACY-${user.id}`, user.email, user.passwordHash, user.rol]
    );
    userByLegacyUser.set(user.id, accountId);

    if (user.rol === 'profesor') {
      const [existingProfessor] = await sequelize.query(
        'SELECT id_catedratico FROM Catedratico WHERE id_persona = ? LIMIT 1',
        { replacements: [resolvedPersonId] }
      );
      const professorId = existingProfessor[0]?.id_catedratico || await insertId(
        'INSERT INTO Catedratico (id_persona, id_usuario) VALUES (?, ?)',
        [resolvedPersonId, accountId]
      );
      professorByLegacyUser.set(user.id, professorId);
    }
  }

  for (const course of legacyCourses) {
    const [existingCourse] = await sequelize.query(
      'SELECT id_curso FROM Curso WHERE codigo_curso = ? LIMIT 1',
      { replacements: [course.codigo] }
    );
    const courseId = existingCourse[0]?.id_curso || await insertId(
      'INSERT INTO Curso (codigo_curso, nombre_curso, creditos) VALUES (?, ?, ?)',
      [course.codigo, course.nombre, course.creditos]
    );
    courseByLegacyCourse.set(course.id, courseId);
  }

  const demoProfessorId = professorByLegacyUser.values().next().value;
  if (demoProfessorId) {
    for (const courseId of courseByLegacyCourse.values()) {
      await sequelize.query(
        'INSERT IGNORE INTO Curso_Catedratico (id_curso, id_catedratico) VALUES (?, ?)',
        { replacements: [courseId, demoProfessorId] }
      );
    }
  }

  for (const grade of legacyGrades) {
    const userId = userByLegacyUser.get(grade.studentId);
    const courseId = courseByLegacyCourse.get(grade.courseId);
    if (!userId || !courseId) continue;

    const [existingGrade] = await sequelize.query(
      'SELECT id_calificacion FROM Calificacion WHERE id_usuario = ? AND id_curso = ? AND periodo = ? LIMIT 1',
      { replacements: [userId, courseId, grade.periodo] }
    );
    if (!existingGrade.length) {
      await sequelize.query(
        'INSERT INTO Calificacion (id_usuario, id_curso, nota, periodo, comentario) VALUES (?, ?, ?, ?, ?)',
        { replacements: [userId, courseId, grade.score, grade.periodo, grade.comentario] }
      );
    }

    if (Number(grade.score) >= 70) {
      await sequelize.query(
        'INSERT IGNORE INTO Curso_Aprobado (id_usuario, id_curso, fecha_aprobacion) VALUES (?, ?, CURRENT_DATE)',
        { replacements: [userId, courseId] }
      );
    }
  }

  for (const post of legacyPosts) {
    const userId = userByLegacyUser.get(post.autorId);
    const courseId = courseByLegacyCourse.get(post.courseId);
    const professorId = professorByLegacyUser.get(post.destinatarioId);
    if (!userId || (!courseId && !professorId)) continue;

    const type = professorId ? 'catedratico' : 'curso';
    const [existingPost] = await sequelize.query(
      'SELECT id_publicacion FROM Publicacion WHERE id_usuario = ? AND contenido = ? LIMIT 1',
      { replacements: [userId, post.contenido] }
    );
    if (!existingPost.length) {
      await sequelize.query(
        'INSERT INTO Publicacion (id_usuario, tipo_entidad, id_curso, id_catedratico, titulo, contenido) VALUES (?, ?, ?, ?, ?, ?)',
        { replacements: [userId, type, courseId || null, professorId || null, post.titulo, post.contenido] }
      );
    }
  }

  console.log('Datos legacy migrados al esquema nuevo.');
}

migrate()
  .catch((error) => {
    console.error('Error migrando datos legacy:', error);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
