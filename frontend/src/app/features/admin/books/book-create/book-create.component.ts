import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { UploadService } from '../../../../core/services/upload.service';
import { BookService } from '../../../../core/services/book.service';

@Component({
  selector: 'app-book-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, ImageUploadComponent],
  template: `
    <div class="p-6 max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-semibold text-slate-800">Add New Book</h1>
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

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
              <app-image-upload 
                [currentImageUrl]="form.get('coverImageUrl')?.value"
                altText="Book cover"
                (imageSelected)="onImageSelected($event)"
                (imageRemoved)="onImageRemoved()">
              </app-image-upload>
            </div>
            <mat-form-field appearance="outline" class="md:col-span-2">
              <mat-label>Description</mat-label>
              <textarea matInput rows="3" formControlName="description"></textarea>
            </mat-form-field>
          </form>

          <div class="mt-4 flex justify-end gap-2">
            <button mat-button routerLink="/admin/books">Cancel</button>
            <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid || loading">Save</button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class BookCreateComponent implements OnInit {
  form: FormGroup;
  loading = false;
  categories: string[] = [];

  constructor(
    private fb: FormBuilder, 
    private books: BookService, 
    private uploadService: UploadService,
    private toastr: ToastrService, 
    private router: Router
  ) {
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
    this.form.get('totalCopies')!.valueChanges.subscribe(v => {
      const a = this.form.get('availableCopies')!.value || 0;
      if (v < a) this.form.patchValue({ availableCopies: v }, { emitEvent: false });
    });
  }

  ngOnInit() {
    this.books.getCategories().subscribe({ next: (c) => this.categories = c });
  }

  onImageSelected(file: File) {
    // Store the file for later upload after book creation
    this.selectedFile = file;
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.form.patchValue({ coverImageUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  onImageRemoved() {
    this.selectedFile = null;
    this.form.patchValue({ coverImageUrl: '' });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const { coverImageUrl, ...rest } = this.form.value;
    const payload = { ...rest } as any;
    
    // Create book first
    this.books.create(payload).subscribe({
      next: (book: any) => {
        // If we have an image file, upload it
        if (this.selectedFile) {
          this.uploadService.uploadBookCover(book.id, this.selectedFile).subscribe({
            next: () => {
              this.toastr.success('Book created with cover image');
              this.router.navigate(['/admin/books']);
            },
            error: () => {
              this.toastr.warning('Book created but failed to upload cover image');
              this.router.navigate(['/admin/books']);
            }
          });
        } else {
          this.toastr.success('Book created');
          this.router.navigate(['/admin/books']);
        }
      },
      error: () => { 
        this.loading = false; 
        this.toastr.error('Failed to create book'); 
      }
    });
  }

  private selectedFile: File | null = null;
}
