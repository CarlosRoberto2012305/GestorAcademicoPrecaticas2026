const { sequelize, User, Course, Grade, Post } = require('./models');

async function seedDatabase() {
  try {
    await sequelize.sync();

    const existingUsers = await User.count();
    if (existingUsers === 0) {
      const admin = await User.create({
        nombre: 'Admin General',
        email: 'admin@demo.com',
        passwordHash: '$2b$10$6rkcI2J7uE5F2f7LnV9BjOHxvT9jVm1qhZu3c3xgD4w3JZ20v3SJ2K',
        rol: 'admin',
      });

      const profesor = await User.create({
        nombre: 'Profesor Demo',
        email: 'profesor@demo.com',
        passwordHash: '$2b$10$6rkcI2J7uE5F2f7LnV9BjOHxvT9jVm1qhZu3c3xgD4w3JZ20v3SJ2K',
        rol: 'profesor',
      });

      const estudiante = await User.create({
        nombre: 'Estudiante Demo',
        email: 'estudiante@demo.com',
        passwordHash: '$2b$10$6rkcI2J7uE5F2f7LnV9BjOHxvT9jVm1qhZu3c3xgD4w3JZ20v3SJ2K',
        rol: 'estudiante',
      });

      console.log('Usuarios base creados:', { admin: admin.email, profesor: profesor.email, estudiante: estudiante.email });
    }

    const existingCourses = await Course.count();
    if (existingCourses === 0) {
      const curso1 = await Course.create({
        nombre: 'Matemáticas I',
        codigo: 'MAT-101',
        descripcion: 'Curso básico de matemáticas.',
        creditos: 4,
      });

      const curso2 = await Course.create({
        nombre: 'Programación Web',
        codigo: 'WEB-201',
        descripcion: 'Fundamentos de desarrollo web.',
        creditos: 5,
      });

      console.log('Cursos base creados:', curso1.codigo, curso2.codigo);
    }

    const existingGrades = await Grade.count();
    if (existingGrades === 0) {
      const estudiantes = await User.findAll({ where: { rol: 'estudiante' } });
      const cursos = await Course.findAll();

      if (estudiantes.length > 0 && cursos.length > 0) {
        await Grade.create({
          score: 92.5,
          periodo: '2026-1',
          comentario: 'Excelente desempeño',
          studentId: estudiantes[0].id,
          courseId: cursos[0].id,
        });

        await Grade.create({
          score: 88,
          periodo: '2026-1',
          comentario: 'Buen avance',
          studentId: estudiantes[0].id,
          courseId: cursos[1].id,
        });
      }

      console.log('Calificaciones base creadas.');
    }

    const existingPosts = await Post.count();
    if (existingPosts === 0) {
      const adminUser = await User.findOne({ where: { rol: 'admin' } });
      if (adminUser) {
        await Post.create({
          titulo: 'Bienvenida al sistema',
          contenido: 'Este es un mensaje de ejemplo generado al iniciar la aplicación.',
          categoria: 'general',
          autorId: adminUser.id,
        });
      }
      console.log('Publicación base creada.');
    }
  } catch (error) {
    console.error('Error al sembrar datos iniciales:', error);
  }
}

module.exports = { seedDatabase };