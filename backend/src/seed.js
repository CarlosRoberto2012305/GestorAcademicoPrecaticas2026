const { sequelize, User, Course, Grade, Post } = require('./models');
const defaultUsers = require('../config/default-users');

async function seedDatabase() {
  try {
    await sequelize.sync();

    for (const defaultUser of defaultUsers) {
      const [user, created] = await User.findOrCreate({
        where: { email: defaultUser.email },
        defaults: {
          nombre: defaultUser.nombre,
          passwordHash: defaultUser.passwordHash,
          rol: defaultUser.rol,
        },
      });

      if (!created && process.env.NODE_ENV !== 'production') {
        await user.update({
          nombre: defaultUser.nombre,
          passwordHash: defaultUser.passwordHash,
          rol: defaultUser.rol,
        });
      }

      if (created) {
        console.log(`Usuario base creado: ${user.email} (${user.rol})`);
      }
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

    const defaultStudent = await User.findOne({ where: { email: 'estudiante@demo.com' } });
    const availableCourses = await Course.findAll({ order: [['id', 'ASC']] });
    if (defaultStudent && availableCourses.length > 0) {
      const demoGrades = [
        { score: 92.5, comentario: 'Excelente desempeño' },
        { score: 88, comentario: 'Buen avance' },
      ];

      for (const [index, course] of availableCourses.slice(0, 2).entries()) {
        const existingDemoGrade = await Grade.findOne({
          where: { studentId: defaultStudent.id, courseId: course.id },
        });

        if (!existingDemoGrade) {
          await Grade.create({
            ...demoGrades[index],
            periodo: '2026-1',
            studentId: defaultStudent.id,
            courseId: course.id,
          });
        }
      }
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

    const demoStudent = await User.findOne({ where: { email: 'estudiante@demo.com' } });
    const demoProfessor = await User.findOne({ where: { email: 'profesor@demo.com' } });
    const demoCourse = await Course.findOne({ order: [['id', 'ASC']] });
    if (demoStudent && demoProfessor && demoCourse) {
      const existingDemoComment = await Post.findOne({
        where: {
          autorId: demoStudent.id,
          destinatarioId: demoProfessor.id,
          courseId: demoCourse.id,
        },
      });

      if (!existingDemoComment) {
        await Post.create({
          titulo: 'Comentario de prueba',
          contenido: 'El curso está bien organizado y quisiera recibir más ejercicios prácticos.',
          categoria: 'comentario',
          autorId: demoStudent.id,
          destinatarioId: demoProfessor.id,
          courseId: demoCourse.id,
        });
        console.log('Comentario demo del estudiante creado.');
      }
    }
  } catch (error) {
    console.error('Error al sembrar datos iniciales:', error);
  }
}

module.exports = { seedDatabase };