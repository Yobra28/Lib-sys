/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { PrismaClient } from '@prisma/client';

import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@library.com' },
    update: {},
    create: {
      email: 'admin@library.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      phone: '+254700000000',
      regno: 'ADMIN-001',
    } as any,
  });
  console.log('✅ Admin user created:', admin.email);

  // Create Librarian User
  const librarianPassword = await bcrypt.hash('librarian123', 10);
  const librarian = await prisma.user.upsert({
    where: { email: 'librarian@library.com' },
    update: {},
    create: {
      email: 'librarian@library.com',
      password: librarianPassword,
      firstName: 'Jane',
      lastName: 'Librarian',
      role: 'LIBRARIAN',
      phone: '+254700000001',
      regno: 'LIB-001',
    } as any,
  });
  console.log('✅ Librarian user created:', librarian.email);

  // Create Sample Students
  const studentPassword = await bcrypt.hash('student123', 10);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const students = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.student@library.com' },
      update: {},
      create: {
        email: 'john.student@library.com',
        password: studentPassword,
        firstName: 'John',
        lastName: 'Student',
        role: 'STUDENT',
        phone: '+254712345678',
        regno: 'CUC/0001/20',
      } as any,
    }),
    prisma.user.upsert({
      where: { email: 'mary.student@library.com' },
      update: {},
      create: {
        email: 'mary.student@library.com',
        password: studentPassword,
        firstName: 'Mary',
        lastName: 'Wanjiru',
        role: 'STUDENT',
        phone: '+254723456789',
        regno: 'CUC/0002/20',
      } as any,
    }),
  ]);
  console.log('✅ Sample students created');

  // Create a richer set of Books (idempotent via ISBN)
  const bookData = [
    // Programming (Robert C. Martin series)
    { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', category: 'Programming', publisher: 'Prentice Hall', publishedYear: 2008, edition: '1st', totalCopies: 5, availableCopies: 5, description: 'A handbook of agile software craftsmanship' },
    { title: 'The Clean Coder', author: 'Robert C. Martin', isbn: '978-0137081073', category: 'Programming', publisher: 'Prentice Hall', publishedYear: 2011, edition: '1st', totalCopies: 4, availableCopies: 4, description: 'A Code of Conduct for Professional Programmers' },
    { title: 'Clean Architecture', author: 'Robert C. Martin', isbn: '978-0134494166', category: 'Programming', publisher: 'Pearson', publishedYear: 2017, edition: '1st', totalCopies: 4, availableCopies: 4, description: 'A Craftsman’s Guide to Software Structure and Design' },
    // Programming (others)
    { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '978-0135957059', category: 'Programming', publisher: 'Addison-Wesley', publishedYear: 2019, edition: '2nd', totalCopies: 3, availableCopies: 3, description: 'Your journey to mastery' },
    { title: 'Refactoring', author: 'Martin Fowler', isbn: '978-0201485677', category: 'Programming', publisher: 'Addison-Wesley', publishedYear: 1999, edition: '1st', totalCopies: 3, availableCopies: 3, description: 'Improving the Design of Existing Code' },
    { title: 'Patterns of Enterprise Application Architecture', author: 'Martin Fowler', isbn: '978-0321127426', category: 'Programming', publisher: 'Addison-Wesley', publishedYear: 2002, edition: '1st', totalCopies: 3, availableCopies: 3, description: 'Enterprise application patterns' },

    // Computer Science core
    { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', category: 'Computer Science', publisher: 'MIT Press', publishedYear: 2009, edition: '3rd', totalCopies: 4, availableCopies: 4, description: 'Comprehensive introduction to algorithms' },
    { title: 'Computer Networks', author: 'Andrew S. Tanenbaum', isbn: '978-0132126953', category: 'Computer Science', publisher: 'Prentice Hall', publishedYear: 2010, edition: '5th', totalCopies: 4, availableCopies: 4, description: 'Networking fundamentals' },
    { title: 'Modern Operating Systems', author: 'Andrew S. Tanenbaum', isbn: '978-0133591620', category: 'Computer Science', publisher: 'Pearson', publishedYear: 2014, edition: '4th', totalCopies: 4, availableCopies: 4, description: 'Operating systems concepts' },
    { title: 'Operating System Concepts', author: 'Abraham Silberschatz', isbn: '978-1118063330', category: 'Computer Science', publisher: 'Wiley', publishedYear: 2012, edition: '9th', totalCopies: 3, availableCopies: 3, description: 'OS classic' },
    { title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', isbn: '978-0134610993', category: 'Computer Science', publisher: 'Pearson', publishedYear: 2016, edition: '3rd', totalCopies: 3, availableCopies: 3, description: 'Standard AI textbook' },
    { title: 'Computer Organization and Design', author: 'David A. Patterson', isbn: '978-0124077263', category: 'Computer Science', publisher: 'Morgan Kaufmann', publishedYear: 2013, edition: '5th', totalCopies: 3, availableCopies: 3, description: 'Hardware and architecture' },
    { title: 'Compilers: Principles, Techniques, and Tools', author: 'Alfred V. Aho', isbn: '978-0321486813', category: 'Computer Science', publisher: 'Pearson', publishedYear: 2006, edition: '2nd', totalCopies: 2, availableCopies: 2, description: 'The Dragon Book' },

    // Data & ML
    { title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow', author: 'Aurélien Géron', isbn: '978-1492032649', category: 'Computer Science', publisher: "O'Reilly", publishedYear: 2019, edition: '2nd', totalCopies: 3, availableCopies: 3, description: 'Practical ML' },
    { title: 'Deep Learning', author: 'Ian Goodfellow', isbn: '978-0262035613', category: 'Computer Science', publisher: 'MIT Press', publishedYear: 2016, edition: '1st', totalCopies: 2, availableCopies: 2, description: 'Deep learning fundamentals' },
    { title: 'Python for Data Analysis', author: 'Wes McKinney', isbn: '978-1491957660', category: 'Computer Science', publisher: "O'Reilly", publishedYear: 2017, edition: '2nd', totalCopies: 3, availableCopies: 3, description: 'Pandas and data analysis' },

    // Databases / systems
    { title: 'Database System Concepts', author: 'Abraham Silberschatz', isbn: '978-0073523323', category: 'Computer Science', publisher: 'McGraw-Hill', publishedYear: 2010, edition: '6th', totalCopies: 3, availableCopies: 3, description: 'Database fundamentals' },
    { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '978-1449373320', category: 'Computer Science', publisher: "O'Reilly", publishedYear: 2017, edition: '1st', totalCopies: 3, availableCopies: 3, description: 'Scalable and reliable systems' },

    // Additional CS to strengthen recommendations
    { title: 'Structure and Interpretation of Computer Programs', author: 'Harold Abelson', isbn: '978-0262510875', category: 'Computer Science', publisher: 'MIT Press', publishedYear: 1996, edition: '2nd', totalCopies: 2, availableCopies: 2, description: 'SICP' },
    { title: 'The Art of Computer Programming, Vol 1', author: 'Donald E. Knuth', isbn: '978-0201896831', category: 'Computer Science', publisher: 'Addison-Wesley', publishedYear: 1997, edition: '3rd', totalCopies: 2, availableCopies: 2, description: 'Fundamental algorithms' },
    { title: 'Introduction to the Theory of Computation', author: 'Michael Sipser', isbn: '978-1133187790', category: 'Computer Science', publisher: 'Cengage', publishedYear: 2012, edition: '3rd', totalCopies: 2, availableCopies: 2, description: 'Theory of computation' },

    // Keep some non-CS to ensure catalog breadth
    { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '978-0385474542', category: 'Literature', publisher: 'Anchor Books', publishedYear: 1994, totalCopies: 6, availableCopies: 6, description: 'African literary classic' },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', category: 'Fiction', publisher: 'Scribner', publishedYear: 2004, totalCopies: 4, availableCopies: 4, description: 'American classic novel' },
  ];

  await prisma.book.createMany({ data: bookData as any, skipDuplicates: true });
  console.log(`✅ Seeded ${bookData.length} books (skipDuplicates enabled)`);

  // Add some borrow history to create popularity signal
  const john = await prisma.user.findUnique({ where: { email: 'john.student@library.com' } });
  const mary = await prisma.user.findUnique({ where: { email: 'mary.student@library.com' } });

  const popularIsbns = [
    '978-0132350884', // Clean Code
    '978-0134494166', // Clean Architecture
    '978-0135957059', // Pragmatic Programmer
    '978-0132126953', // Computer Networks
    '978-0133591620', // Modern Operating Systems
    '978-1449373320', // DDIA
  ];

  const now = new Date();
  const due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const popularBooks = await prisma.book.findMany({ where: { isbn: { in: popularIsbns } }, select: { id: true } });

  // Create a few borrows for popularity (does not decrement availableCopies)
  if (john && mary) {
    const borrowData: { userId: string; bookId: string; dueDate: Date }[] = [];
    popularBooks.forEach((b, idx) => {
      borrowData.push({ userId: john.id, bookId: b.id, dueDate: due });
      if (idx % 2 === 0) borrowData.push({ userId: mary.id, bookId: b.id, dueDate: due });
    });
    await Promise.all(
      borrowData.map((d) =>
        prisma.borrow.upsert({
          where: {
            // pseudo-unique: not real unique constraint, so use create and catch
            id: `${d.userId.substring(0, 8)}-${d.bookId.substring(0, 8)}` as any,
          } as any,
          update: {},
          create: { userId: d.userId, bookId: d.bookId, dueDate: d.dueDate } as any,
        }).catch(async () => {
          // fallback if upsert key hack fails: try create
          try { await prisma.borrow.create({ data: { userId: d.userId, bookId: d.bookId, dueDate: d.dueDate } }); } catch {}
        })
      )
    );
    console.log(`✅ Seeded popularity borrows for ${popularBooks.length} books`);
  }

  // Create Sample Seats (idempotent)
  const seatData: { seatNumber: string; floor: number; section: string; description: string }[] = [];
  const sections = ['Reading Hall', 'Study Room A', 'Study Room B', 'Silent Zone'];

  for (let floor = 1; floor <= 2; floor++) {
    for (let i = 1; i <= 20; i++) {
      const section = sections[Math.floor(Math.random() * sections.length)];
      seatData.push({
        seatNumber: `${String.fromCharCode(64 + floor)}-${i.toString().padStart(3, '0')}`,
        floor,
        section,
        description: `Floor ${floor} - ${section}`,
      });
    }
  }

  await prisma.seat.createMany({ data: seatData as any, skipDuplicates: true });
  console.log(`✅ Ensured ${seatData.length} seats exist (skipDuplicates enabled)`);

  // Create System Configuration
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'FINE_DAILY_RATE',
        value: '5.0',
        description: 'Fine amount per day for overdue books',
      },
      {
        key: 'BORROW_DURATION_DAYS',
        value: '14',
        description: 'Default borrowing period in days',
      },
      {
        key: 'MAX_RENEWALS',
        value: '2',
        description: 'Maximum number of renewals allowed',
      },
      {
        key: 'LIBRARY_NAME',
        value: 'Smart Library System',
        description: 'Name of the library',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ System configuration created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('Admin: admin@library.com / admin123');
  console.log('Librarian: librarian@library.com / librarian123');
  console.log('Student: john.student@library.com / student123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });