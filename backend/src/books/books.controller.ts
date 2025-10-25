/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FilterBookDto } from './dto/filter-book.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('books')
@Controller('books')
@ApiBearerAuth()
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Create new book (Admin/Librarian only)' })
  @ApiResponse({ status: 201, description: 'Book created successfully' })
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all books with optional filters' })
  @ApiResponse({ status: 200, description: 'Books retrieved successfully' })
  findAll(@Query() filterDto: FilterBookDto) {
    return this.booksService.findAll(filterDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all book categories' })
  getCategories() {
    return this.booksService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book by ID' })
  @ApiResponse({ status: 200, description: 'Book retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Update book (Admin/Librarian only)' })
  @ApiResponse({ status: 200, description: 'Book updated successfully' })
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @ApiOperation({ summary: 'Delete book (Admin/Librarian only)' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }

  @Post(':id/upload-cover')
  @Roles(UserRole.ADMIN, UserRole.LIBRARIAN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload book cover image (Admin/Librarian only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Cover image uploaded successfully' })
  async uploadCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 5MB.');
    }

    try {
      const imageUrl = await this.cloudinaryService.uploadImage(file, 'library/book-covers');
      
      // Update book with cover image URL
      const updatedBook = await this.booksService.update(id, { coverImage: imageUrl });
      
      return {
        success: true,
        imageUrl,
        book: updatedBook,
        message: 'Book cover uploaded successfully'
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload cover image');
    }
  }
}
