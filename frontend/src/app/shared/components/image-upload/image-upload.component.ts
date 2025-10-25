import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <div class="image-upload-container">
      <!-- Current Image Display -->
      <div *ngIf="currentImageUrl" class="current-image mb-4">
        <mat-card class="max-w-xs">
          <mat-card-content class="p-2">
            <img [src]="currentImageUrl" 
                 [alt]="altText" 
                 class="w-full h-48 object-cover rounded"
                 (error)="onImageError($event)">
            <div class="mt-2 text-center">
              <button mat-button color="warn" (click)="removeImage()" size="small">
                <mat-icon>delete</mat-icon>
                Remove
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Upload Area -->
      <div class="upload-area" 
           [class.dragover]="isDragOver"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           (click)="fileInput.click()">
        
        <input #fileInput 
               type="file" 
               accept="image/*" 
               (change)="onFileSelected($event)"
               class="hidden">
        
        <div *ngIf="!uploading" class="upload-content">
          <mat-icon class="text-6xl text-gray-400 mb-4">cloud_upload</mat-icon>
          <p class="text-lg font-semibold text-gray-600 mb-2">
            {{currentImageUrl ? 'Change Image' : 'Upload Image'}}
          </p>
          <p class="text-sm text-gray-500 mb-4">
            Drag and drop an image here, or click to select
          </p>
          <p class="text-xs text-gray-400">
            Supports: JPEG, PNG, WebP (Max 5MB)
          </p>
        </div>

        <div *ngIf="uploading" class="upload-content">
          <mat-spinner diameter="40"></mat-spinner>
          <p class="text-lg font-semibold text-gray-600 mt-4">Uploading...</p>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="error-message mt-2">
        <p class="text-red-600 text-sm">{{errorMessage}}</p>
      </div>
    </div>
  `,
  styles: [`
    .image-upload-container {
      max-width: 400px;
    }

    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #f9fafb;
    }

    .upload-area:hover {
      border-color: #3b82f6;
      background-color: #eff6ff;
    }

    .upload-area.dragover {
      border-color: #3b82f6;
      background-color: #eff6ff;
      transform: scale(1.02);
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .error-message {
      text-align: center;
    }
  `]
})
export class ImageUploadComponent implements OnInit {
  @Input() currentImageUrl: string | null = null;
  @Input() altText: string = 'Upload image';
  @Input() maxSize: number = 5 * 1024 * 1024; // 5MB
  @Input() allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  @Output() imageSelected = new EventEmitter<File>();
  @Output() imageRemoved = new EventEmitter<void>();

  isDragOver = false;
  uploading = false;
  errorMessage = '';

  ngOnInit() {
    // Component initialization
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.handleFile(target.files[0]);
    }
  }

  private handleFile(file: File) {
    this.errorMessage = '';
    
    // Validate file type
    if (!this.allowedTypes.includes(file.type)) {
      this.errorMessage = 'Invalid file type. Please select a JPEG, PNG, or WebP image.';
      return;
    }

    // Validate file size
    if (file.size > this.maxSize) {
      this.errorMessage = `File size too large. Maximum size is ${this.maxSize / (1024 * 1024)}MB.`;
      return;
    }

    this.imageSelected.emit(file);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  removeImage() {
    this.currentImageUrl = null;
    this.imageRemoved.emit();
  }
}
