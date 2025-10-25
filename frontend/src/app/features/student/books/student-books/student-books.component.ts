import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ToastrService } from 'ngx-toastr';
import { BookService } from '../../../../core/services/book.service';
import { BorrowService, BorrowDuration } from '../../../../core/services/borrow.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Book, BookStatus } from '../../../../core/models/book.model';
import { BorrowDurationDialogComponent } from '../borrow-duration-dialog/borrow-duration-dialog.component';
import { BookDetailDialogComponent } from '../book-detail-dialog/book-detail-dialog.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-student-books',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonToggleModule
  ],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Browse Books</h1>

      <!-- Search and Filter Section -->
      <mat-card class="mb-6">
        <mat-card-content class="pt-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Search Books</mat-label>
              <input matInput [formControl]="searchControl" placeholder="Title, author, or ISBN...">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Category</mat-label>
              <mat-select [formControl]="categoryControl">
                <mat-option [value]="null">All Categories</mat-option>
                <mat-option *ngFor="let category of categories" [value]="category">
                  {{category}}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="statusControl">
                <mat-option [value]="null">All Status</mat-option>
                <mat-option value="AVAILABLE">Available</mat-option>
                <mat-option value="BORROWED">Borrowed</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="searchBooks()" class="h-14">
              <mat-icon>search</mat-icon>
              Search
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading Spinner -->
      <div *ngIf="loading" class="flex justify-center items-center py-20">
        <mat-spinner></mat-spinner>
      </div>

      <!-- Results toolbar -->
      <div *ngIf="!loading && books.length > 0" class="flex items-center justify-between mb-3">
        <span class="text-sm text-slate-500">{{ books.length }} result(s)</span>
        <mat-button-toggle-group [value]="viewMode" (change)="viewMode = $event.value" appearance="legacy" aria-label="View mode">
          <mat-button-toggle value="grid" matTooltip="Grid view">
            <mat-icon>grid_view</mat-icon>
          </mat-button-toggle>
          <mat-button-toggle value="list" matTooltip="List view">
            <mat-icon>view_list</mat-icon>
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <!-- Books -->
      <ng-container *ngIf="!loading && books.length > 0">
        <!-- Grid view -->
        <div *ngIf="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <mat-card *ngFor="let book of books" class="hover:shadow-xl transition-shadow overflow-hidden">
            <ng-container *ngIf="getCoverUrl(book) as cover; else noCoverGrid">
              <img [src]="cover" alt="{{book.title}} cover" class="w-full h-48 object-cover" loading="lazy" (error)="onImageError($event)">
            </ng-container>
            <ng-template #noCoverGrid>
              <div class="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <mat-icon class="text-white text-8xl">book</mat-icon>
              </div>
            </ng-template>
            
            <mat-card-content class="pt-4">
              <h3 class="font-bold text-lg mb-2 line-clamp-2">{{book.title}}</h3>
              <p class="text-sm text-gray-600 mb-2">{{book.author}}</p>
              <p class="text-xs text-gray-500 mb-1">{{book.category}} • {{book.publishedYear}}</p>
              <p class="text-xs text-gray-500 mb-3">ISBN: {{book.isbn}}</p>
              
              <div class="flex justify-between items-center mb-3">
                <mat-chip-set>
                  <mat-chip [class]="getStatusClass(book)">
                    {{book.availableCopies}} / {{book.totalCopies}} Available
                  </mat-chip>
                </mat-chip-set>
              </div>

              <div class="flex gap-2">
                <button mat-raised-button color="primary" 
                        [disabled]="book.availableCopies === 0 || borrowing"
                        (click)="borrowBook(book)"
                        class="flex-1">
                  <mat-icon>add</mat-icon>
                  Borrow
                </button>
                <button mat-icon-button (click)="viewDetails(book)">
                  <mat-icon>info</mat-icon>
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- List view -->
        <div *ngIf="viewMode === 'list'" class="space-y-4">
          <mat-card *ngFor="let book of books" class="hover:shadow-md transition-shadow">
            <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4">
              <div class="flex-shrink-0">
                <ng-container *ngIf="getCoverUrl(book) as cover; else noCoverList">
                  <img [src]="cover" alt="{{book.title}} cover" class="w-24 h-32 object-cover rounded" loading="lazy" (error)="onImageError($event)">
                </ng-container>
                <ng-template #noCoverList>
                  <div class="w-24 h-32 bg-gradient-to-br from-blue-400 to-blue-600 grid place-items-center rounded">
                    <mat-icon class="text-white text-4xl">book</mat-icon>
                  </div>
                </ng-template>
              </div>

              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-slate-900 truncate">{{ book.title }}</h3>
                <p class="text-sm text-gray-600">{{ book.author }}</p>
                <p class="text-xs text-gray-500">{{book.category}} • {{book.publishedYear}} • ISBN: {{book.isbn}}</p>
                <div class="mt-2">
                  <mat-chip-set>
                    <mat-chip [class]="getStatusClass(book)">
                      {{book.availableCopies}} / {{book.totalCopies}} Available
                    </mat-chip>
                  </mat-chip-set>
                </div>
              </div>

              <div class="flex items-center gap-2 w-full sm:w-auto">
                <button mat-raised-button color="primary" 
                        [disabled]="book.availableCopies === 0 || borrowing"
                        (click)="borrowBook(book)"
                        class="flex-1 sm:flex-none">
                  <mat-icon>add</mat-icon>
                  Borrow
                </button>
                <button mat-stroked-button (click)="viewDetails(book)" class="flex-1 sm:flex-none">
                  <mat-icon>info</mat-icon>
                  Details
                </button>
              </div>
            </div>
          </mat-card>
        </div>
      </ng-container>

      <!-- No Results -->
      <div *ngIf="!loading && books.length === 0" class="text-center py-20">
        <mat-icon class="text-gray-300 text-8xl">library_books</mat-icon>
        <h2 class="text-2xl text-gray-600 mt-4">No books found</h2>
        <p class="text-gray-500 mt-2">Try adjusting your search filters</p>
      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class StudentBooksComponent implements OnInit {
  books: Book[] = [];
  categories: string[] = [];
  loading = false;
  borrowing = false;
  viewMode: 'grid' | 'list' = 'list';

  searchControl = new FormControl('');
  categoryControl = new FormControl(null);
  statusControl = new FormControl(null);

  // Borrow duration options
  borrowDurations = [
    { value: BorrowDuration.THREE_DAYS, label: '3 Days', days: 3 },
    { value: BorrowDuration.FIVE_DAYS, label: '5 Days', days: 5 },
    { value: BorrowDuration.ONE_WEEK, label: '1 Week', days: 7 },
    { value: BorrowDuration.TWO_WEEKS, label: '2 Weeks', days: 14 }
  ];

  constructor(
    private bookService: BookService,
    private borrowService: BorrowService,
    private authService: AuthService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadBooks();
    this.loadCategories();
    this.setupSearchListener();
  }

  setupSearchListener() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => this.searchBooks());
  }

  loadBooks() {
    this.loading = true;
    const filters = this.getFilters();

    this.bookService.getAll(filters).subscribe({
      next: (books: Book[]) => {
        this.books = books;
        this.loading = false;
      },
      error: (error: any) => {
        this.toastr.error('Failed to load books');
        this.loading = false;
      }
    });
  }

  loadCategories() {
    this.bookService.getCategories().subscribe({
      next: (categories: string[]) => {
        this.categories = categories;
      }
    });
  }

  searchBooks() {
    this.loadBooks();
  }

  getFilters() {
    return {
      search: this.searchControl.value || undefined,
      category: this.categoryControl.value || undefined,
      status: this.statusControl.value || undefined
    };
  }

  borrowBook(book: Book) {
    if (this.borrowing) return;

    // Open dialog to select duration
    const dialogRef = this.dialog.open(BorrowDurationDialogComponent, {
      width: '400px',
      data: { book, durations: this.borrowDurations }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.processBorrow(book, result.duration);
      }
    });
  }

  private processBorrow(book: Book, duration: BorrowDuration) {
    this.borrowing = true;

    this.borrowService.createSelf({
      bookId: book.id,
      duration: duration
    }).subscribe({
      next: () => {
        this.toastr.success(`Successfully borrowed "${book.title}"`);
        this.loadBooks(); // Refresh the list
        this.borrowing = false;
      },
      error: (error: any) => {
        this.toastr.error(error.error?.message || 'Failed to borrow book');
        this.borrowing = false;
      }
    });
  }

  getCoverUrl(book: any): string | null {
    return book?.coverImage || null;
  }

  onImageError(event: Event) {
    const el = event.target as HTMLImageElement;
    if (el) {
      el.style.display = 'none';
      const parent = el.parentElement as HTMLElement;
      if (parent) {
        parent.insertAdjacentHTML('beforeend', '<div class="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center"><mat-icon class="text-white text-8xl">book</mat-icon></div>');
      }
    }
  }

  viewDetails(book: Book) {
    this.dialog.open(BookDetailDialogComponent, {
      width: '560px',
      maxWidth: '90vw',
      maxHeight: 'none',
      panelClass: 'book-details-dialog',
      autoFocus: false,
      data: { book }
    });
  }

  getStatusClass(book: Book): string {
    if (book.availableCopies === 0) {
      return 'bg-red-100 text-red-700';
    } else if (book.availableCopies <= 2) {
      return 'bg-orange-100 text-orange-700';
    }
    return 'bg-green-100 text-green-700';
  }
}
