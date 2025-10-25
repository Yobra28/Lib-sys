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
      address: 'Library Office',
    },
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
      address: 'Library Office',
    },
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
        address: 'Chuka, Kenya',
      },
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
        address: 'Nairobi, Kenya',
      },
    }),
  ]);
  console.log('✅ Sample students created');

  // Create Sample Books
  const books = await Promise.all([
    prisma.book.create({
      data: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        category: 'Programming',
        publisher: 'Prentice Hall',
        publishedYear: 2008,
        edition: '1st',
        totalCopies: 5,
        availableCopies: 5,
        description: 'A handbook of agile software craftsmanship',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt',
        isbn: '978-0135957059',
        category: 'Programming',
        publisher: 'Addison-Wesley',
        publishedYear: 2019,
        edition: '2nd',
        totalCopies: 3,
        availableCopies: 3,
        description: 'Your journey to mastery',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen',
        isbn: '978-0262033848',
        category: 'Computer Science',
        publisher: 'MIT Press',
        publishedYear: 2009,
        edition: '3rd',
        totalCopies: 4,
        availableCopies: 4,
        description: 'Comprehensive introduction to algorithms',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Things Fall Apart',
        author: 'Chinua Achebe',
        isbn: '978-0385474542',
        category: 'Literature',
        publisher: 'Anchor Books',
        publishedYear: 1994,
        totalCopies: 6,
        availableCopies: 6,
        description: 'African literary classic',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0743273565',
        category: 'Fiction',
        publisher: 'Scribner',
        publishedYear: 2004,
        totalCopies: 4,
        availableCopies: 4,
        description: 'American classic novel',
      },
    }),
  ]);
  console.log(`✅ Created ${books.length} sample books`);

  // Create Sample Seats
  const seats: Promise<any>[] = []; // Explicitly type the array
const sections = ['Reading Hall', 'Study Room A', 'Study Room B', 'Silent Zone'];

for (let floor = 1; floor <= 2; floor++) {
  for (let i = 1; i <= 20; i++) {
    const section = sections[Math.floor(Math.random() * sections.length)];
    seats.push(
      prisma.seat.create({
        data: {
          seatNumber: `${String.fromCharCode(64 + floor)}-${i.toString().padStart(3, '0')}`,
          floor,
          section,
          description: `Floor ${floor} - ${section}`,
        },
      })
    );
  }
}

await Promise.all(seats);
console.log(`✅ Created ${seats.length} sample seats`);


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