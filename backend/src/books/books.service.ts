/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FilterBookDto } from './dto/filter-book.dto';
import { RecommendBooksDto } from './dto/recommend-books.dto';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto) {
    const existingBook = await this.prisma.book.findUnique({
      where: { isbn: createBookDto.isbn },
    });

    if (existingBook) {
      throw new ConflictException('Book with this ISBN already exists');
    }

    return this.prisma.book.create({
      data: {
        ...createBookDto,
        availableCopies: createBookDto.totalCopies,
      },
    });
  }

  async findAll(filterDto?: FilterBookDto) {
    const where: any = {};

    if (filterDto?.search) {
      where.OR = [
        { title: { contains: filterDto.search, mode: 'insensitive' } },
        { author: { contains: filterDto.search, mode: 'insensitive' } },
        { isbn: { contains: filterDto.search, mode: 'insensitive' } },
      ];
    }

    if (filterDto?.category) {
      where.category = { equals: filterDto.category, mode: 'insensitive' };
    }

    if (filterDto?.author) {
      where.author = { contains: filterDto.author, mode: 'insensitive' };
    }

    if (filterDto?.status) {
      where.status = filterDto.status;
    }

    return this.prisma.book.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        borrows: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    await this.findOne(id);

    if (updateBookDto.isbn) {
      const existingBook = await this.prisma.book.findUnique({
        where: { isbn: updateBookDto.isbn },
      });

      if (existingBook && existingBook.id !== id) {
        throw new ConflictException(
          'Another book with this ISBN already exists',
        );
      }
    }

    return this.prisma.book.update({
      where: { id },
      data: updateBookDto,
    });
  }

  async remove(id: string) {
    const book = await this.findOne(id);

    const activeBorrows = await this.prisma.borrow.count({
      where: {
        bookId: id,
        status: { in: ['ACTIVE', 'OVERDUE'] },
      },
    });

    if (activeBorrows > 0) {
      throw new BadRequestException('Cannot delete book with active borrows');
    }

    return this.prisma.book.delete({
      where: { id },
    });
  }

  async getCategories() {
    const categories = await this.prisma.book.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map((c) => c.category);
  }

  async recommend(q: RecommendBooksDto) {
    const { category, studentId, limit = 20 } = q;

    if (!category || category.trim() === '') {
      throw new BadRequestException('category is required');
    }

    const where: any = {
      category: { equals: category, mode: 'insensitive' },
      availableCopies: { gt: 0 },
    };

    // Optionally exclude books the student has already borrowed (any status)
    if (studentId) {
      where.NOT = {
        borrows: {
          some: { userId: studentId },
        },
      };
    }

    return this.prisma.book.findMany({
      where,
      select: {
        id: true,
        title: true,
        author: true,
        coverImage: true,
        category: true,
        availableCopies: true,
        _count: { select: { borrows: true } },
      },
      orderBy: [
        { borrows: { _count: 'desc' } }, // popularity by borrow count
        { createdAt: 'desc' },
      ],
      take: typeof limit === 'number' ? limit : Number(limit),
    });
  }
}
