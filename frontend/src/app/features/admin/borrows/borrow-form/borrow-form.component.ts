import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ToastrService } from 'ngx-toastr';
import { BorrowService, BorrowDuration } from '../../../../core/services/borrow.service';
import { BookService } from '../../../../core/services/book.service';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

@Component({
  selector: 'app-borrow-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule
  ],
  templateUrl: './borrow-form.component.html',
  styleUrls: ['./borrow-form.component.css']
})
export class BorrowFormComponent implements OnInit {
  borrowForm: FormGroup;
  loading = false;
  books: any[] = [];
  filteredBooks!: Observable<any[]>;
  minDate = new Date();

  // Borrow duration options
  borrowDurations = [
    { value: BorrowDuration.THREE_DAYS, label: '3 Days' },
    { value: BorrowDuration.FIVE_DAYS, label: '5 Days' },
    { value: BorrowDuration.ONE_WEEK, label: '1 Week' },
    { value: BorrowDuration.TWO_WEEKS, label: '2 Weeks' }
  ];

  constructor(
    private fb: FormBuilder,
    private borrowService: BorrowService,
    private bookService: BookService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<BorrowFormComponent>
  ) {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 14);

    this.borrowForm = this.fb.group({
      userId: ['', [Validators.required]],
      bookSearch: ['', Validators.required],
      bookId: ['', Validators.required],
      duration: [BorrowDuration.TWO_WEEKS, Validators.required],
      dueDate: [defaultDueDate, Validators.required]
    });
  }

  ngOnInit() {
    this.loadBooks();
    this.setupBookFilter();
  }

  loadBooks() {
    this.bookService.getAll({ status: 'AVAILABLE', page: 1, limit: 100 }).subscribe({
      next: (res) => {
        this.books = res.items.filter(b => b.availableCopies > 0);
      }
    });
  }

  setupBookFilter() {
    this.filteredBooks = this.borrowForm.get('bookSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterBooks(value || ''))
    );
  }

  private _filterBooks(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.books.filter(book => 
      book.title.toLowerCase().includes(filterValue) ||
      book.author.toLowerCase().includes(filterValue)
    );
  }

  onBookSelected(book: any) {
    this.borrowForm.patchValue({
      bookId: book.id,
      bookSearch: `${book.title} - ${book.author}`
    });
  }

  displayBook(book: any): string {
    return book ? `${book.title} - ${book.author}` : '';
  }

  onSubmit() {
    if (this.borrowForm.valid) {
      this.loading = true;
      
      const borrowData = {
        userId: this.borrowForm.value.userId,
        bookId: this.borrowForm.value.bookId,
        duration: this.borrowForm.value.duration,
        dueDate: this.borrowForm.value.dueDate.toISOString()
      };

      this.borrowService.create(borrowData).subscribe({
        next: () => {
          this.toastr.success('Book issued successfully');
          this.dialogRef.close(true);
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
