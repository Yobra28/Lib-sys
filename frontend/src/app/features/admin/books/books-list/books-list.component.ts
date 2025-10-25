import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { BookService } from '../../../../core/services/book.service';
import { Book } from '../../../../core/models/book.model';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-books-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Books Management</h1>
        <a mat-raised-button color="primary" [routerLink]="['/admin/books/new']">
          <mat-icon>add</mat-icon>
          Add New Book
        </a>
      </div>

      <!-- Search and Filter -->
      <div class="mb-6">
        <div class="search-bar-container">
          <mat-form-field appearance="none" class="search-field">
            <mat-label>Search</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Title, author, ISBN...">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="none" class="search-field">
            <mat-label>Category</mat-label>
            <mat-select (selectionChange)="filterByCategory($event.value)">
              <mat-option [value]="null">All Categories</mat-option>
              <mat-option *ngFor="let category of categories" [value]="category">
                {{category}}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="none" class="search-field">
            <mat-label>Status</mat-label>
            <mat-select (selectionChange)="filterByStatus($event.value)">
              <mat-option [value]="null">All Status</mat-option>
              <mat-option value="AVAILABLE">Available</mat-option>
              <mat-option value="BORROWED">Borrowed</mat-option>
              <mat-option value="MAINTENANCE">Maintenance</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button color="accent" (click)="clearFilters()" class="search-button">
            <mat-icon>clear</mat-icon>
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Books Table -->
      <mat-card>
        <mat-card-content class="pt-4">
          <table mat-table [dataSource]="dataSource" matSort class="w-full">
            <!-- Title Column -->
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
              <td mat-cell *matCellDef="let book">{{book.title}}</td>
            </ng-container>

            <!-- Author Column -->
            <ng-container matColumnDef="author">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Author</th>
              <td mat-cell *matCellDef="let book">{{book.author}}</td>
            </ng-container>

            <!-- ISBN Column -->
            <ng-container matColumnDef="isbn">
              <th mat-header-cell *matHeaderCellDef>ISBN</th>
              <td mat-cell *matCellDef="let book">{{book.isbn}}</td>
            </ng-container>

            <!-- Category Column -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
              <td mat-cell *matCellDef="let book">{{book.category}}</td>
            </ng-container>

            <!-- Copies Column -->
            <ng-container matColumnDef="copies">
              <th mat-header-cell *matHeaderCellDef>Copies</th>
              <td mat-cell *matCellDef="let book">
                {{book.availableCopies}} / {{book.totalCopies}}
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let book">
                <mat-chip-set>
                  <mat-chip [class]="getStatusChipClass(book.status)">
                    {{book.status}}
                  </mat-chip>
                </mat-chip-set>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let book">
                <button mat-icon-button [matTooltip]="'View Details'" (click)="viewBook(book)">
                  <mat-icon class="text-blue-600">visibility</mat-icon>
                </button>
                <button mat-icon-button [matTooltip]="'Edit Book'" (click)="editBook(book)">
                  <mat-icon class="text-green-600">edit</mat-icon>
                </button>
                <button mat-icon-button [matTooltip]="'Delete Book'" (click)="deleteBook(book)">
                  <mat-icon class="text-red-600">delete</mat-icon>
                </button>
                <mat-form-field appearance="outline" class="w-40 ml-3 inline-block align-middle">
                  <mat-label>Set status</mat-label>
                  <mat-select [value]="book.status" (selectionChange)="changeStatus(book, $event.value)">
                    <mat-option value="AVAILABLE">Available</mat-option>
                    <mat-option value="BORROWED">Borrowed</mat-option>
                    <mat-option value="MAINTENANCE">Maintenance</mat-option>
                  </mat-select>
                </mat-form-field>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-gray-50"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]" showFirstLastButtons></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .search-bar-container {
      display: flex;
      gap: 0;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .search-field {
      flex: 1;
      margin: 0 !important;
    }

    .search-field ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: transparent !important;
      box-shadow: none !important;
    }

    .search-field ::ng-deep .mat-mdc-text-field-wrapper .mat-mdc-form-field-flex {
      border: none !important;
      box-shadow: none !important;
    }

    .search-field ::ng-deep .mdc-notched-outline__leading,
    .search-field ::ng-deep .mdc-notched-outline__notch,
    .search-field ::ng-deep .mdc-notched-outline__trailing {
      border: none !important;
    }

    .search-field:not(:last-child) ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .search-field ::ng-deep .mat-mdc-form-field-focus-overlay {
      background-color: transparent !important;
    }

    .search-field ::ng-deep .mat-mdc-input-element:focus {
      outline: 2px solid #3b82f6;
      outline-offset: -2px;
      border-radius: 4px;
    }

    .search-button {
      margin-left: 8px !important;
      height: 56px;
      border-radius: 6px;
    }

    @media (max-width: 768px) {
      .search-bar-container {
        flex-direction: column;
        gap: 8px;
        padding: 16px;
      }

      .search-button {
        margin-left: 0 !important;
        width: 100%;
      }
    }
  `]
})
export class BooksListComponent implements OnInit {
  displayedColumns: string[] = ['title', 'author', 'isbn', 'category', 'copies', 'status', 'actions'];
  dataSource!: MatTableDataSource<Book>;
  categories: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private bookService: BookService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.dataSource = new MatTableDataSource<Book>([]);
  }

  ngOnInit() {
    this.loadBooks();
    this.loadCategories();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadBooks() {
    this.bookService.getAll().subscribe({
      next: (books) => {
        this.dataSource.data = books;
      },
      error: (error) => {
        this.toastr.error('Failed to load books');
      }
    });
  }

  loadCategories() {
    this.bookService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByCategory(category: string | null) {
    if (category) {
      this.dataSource.data = this.dataSource.data.filter(book => book.category === category);
    } else {
      this.loadBooks();
    }
  }

  filterByStatus(status: string | null) {
    if (status) {
      this.dataSource.data = this.dataSource.data.filter(book => book.status === status);
    } else {
      this.loadBooks();
    }
  }

  clearFilters() {
    this.dataSource.filter = '';
    this.loadBooks();
  }


  viewBook(book: Book) {
    this.toastr.info(`Viewing: ${book.title}`);
  }

  editBook(book: Book) {
    this.router.navigate(['/admin/books', book.id, 'edit']);
  }

  deleteBook(book: Book) {
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
      this.bookService.delete(book.id).subscribe({
        next: () => {
          this.toastr.success('Book deleted successfully');
          this.loadBooks();
        },
        error: (error) => {
          this.toastr.error(error.error?.message || 'Failed to delete book');
        }
      });
    }
  }

  changeStatus(book: Book, status: string) {
    if (book.status === status) return;
    this.bookService.update(book.id, { status }).subscribe({
      next: () => { this.toastr.success('Status updated'); book.status = status as any; },
      error: () => this.toastr.error('Failed to update status')
    });
  }

  getStatusChipClass(status: string): string {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-700';
      case 'BORROWED':
        return 'bg-orange-100 text-orange-700';
      case 'MAINTENANCE':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  }
}