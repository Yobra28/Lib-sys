import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { BookService } from '../../../../core/services/book.service';

@Component({
  selector: 'app-book-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  template: `
    <div class="p-6 max-w-3xl mx-auto" *ngIf="loaded">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-semibold text-slate-800">Edit Book</h1>
        <a routerLink="/admin/books" mat-button>Back to list</a>
      </div>

      <mat-card>
        <mat-card-content class="pt-4">
          <form [formGroup]="form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Author</mat-label>
              <input matInput formControlName="author" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>ISBN</mat-label>
              <input matInput formControlName="isbn" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                <mat-option *ngFor="let c of categories" [value]="c">{{c}}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Total Copies</mat-label>
              <input matInput type="number" formControlName="totalCopies" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Available Copies</mat-label>
              <input matInput type="number" formControlName="availableCopies" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="AVAILABLE">Available</mat-option>
                <mat-option value="BORROWED">Borrowed</mat-option>
                <mat-option value="MAINTENANCE">Maintenance</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Published Year</mat-label>
              <input matInput type="number" formControlName="publishedYear" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="md:col-span-2">
              <mat-label>Cover Image URL</mat-label>
              <input matInput formControlName="coverImageUrl" placeholder="https://..." />
            </mat-form-field>
            <mat-form-field appearance="outline" class="md:col-span-2">
              <mat-label>Description</mat-label>
              <textarea matInput rows="3" formControlName="description"></textarea>
            </mat-form-field>
          </form>

          <div class="mt-4 flex justify-end gap-2">
            <button mat-button routerLink="/admin/books">Cancel</button>
            <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || loading">Update</button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class BookEditComponent implements OnInit {
  form: FormGroup;
  loading = false;
  loaded = false;
  categories: string[] = [];
  id!: string;

  constructor(private fb: FormBuilder, private books: BookService, private route: ActivatedRoute, private toastr: ToastrService, private router: Router) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
      isbn: ['', Validators.required],
      category: ['', Validators.required],
      totalCopies: [1, [Validators.required, Validators.min(1)]],
      availableCopies: [1, [Validators.required, Validators.min(0)]],
      status: ['AVAILABLE', Validators.required],
      publishedYear: [new Date().getFullYear()],
      coverImageUrl: [''],
      description: ['']
    });
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.books.getCategories().subscribe({ next: (c) => this.categories = c });
    this.books.getById(this.id).subscribe({
      next: (book: any) => {
        this.form.patchValue({ ...book, coverImageUrl: book.coverImage });
        this.loaded = true;
      },
      error: () => { this.toastr.error('Book not found'); this.router.navigate(['/admin/books']); }
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const { coverImageUrl, ...rest } = this.form.value;
    const payload = { ...rest, coverImage: coverImageUrl } as any;
    this.books.update(this.id, payload).subscribe({
      next: () => { this.toastr.success('Book updated'); this.router.navigate(['/admin/books']); },
      error: () => { this.loading = false; this.toastr.error('Failed to update book'); }
    });
  }
}
