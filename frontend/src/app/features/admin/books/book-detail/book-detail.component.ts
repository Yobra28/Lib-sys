import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { BookService } from '../../../../core/services/book.service';
import { Book } from '../../../../core/models/book.model';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatTableModule
  ],
  templateUrl: './book-detail.component.html'
})
export class BookDetailComponent implements OnInit {
  book: Book | null = null;
  loading = true;
  activeBorrows: any[] = [];

  constructor(
    private bookService: BookService,
    public dialogRef: MatDialogRef<BookDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { bookId: string }
  ) {}

  ngOnInit() {
    this.loadBookDetails();
  }

  loadBookDetails() {
    this.bookService.getById(this.data.bookId).subscribe({
      next: (book: any) => {
        this.book = book;
        this.activeBorrows = book.borrows || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}

