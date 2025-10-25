import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-book-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="w-[520px] max-w-full">
      <h2 class="text-xl font-semibold text-slate-800 mb-1">{{data?.book?.title}}</h2>
      <p class="text-sm text-slate-600 mb-3">{{data?.book?.author}}</p>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="text-slate-500">Category</div>
          <div class="font-medium">{{data?.book?.category}}</div>
        </div>
        <div>
          <div class="text-slate-500">Published</div>
          <div class="font-medium">{{data?.book?.publishedYear || '-'}}</div>
        </div>
        <div>
          <div class="text-slate-500">ISBN</div>
          <div class="font-medium">{{data?.book?.isbn}}</div>
        </div>
        <div>
          <div class="text-slate-500">Copies</div>
          <div class="font-medium">{{data?.book?.availableCopies}} / {{data?.book?.totalCopies}}</div>
        </div>
      </div>
      <div class="mt-4 text-sm" *ngIf="data?.book?.description">
        <div class="text-slate-500">Description</div>
        <p class="mt-1">{{data?.book?.description}}</p>
      </div>
      <div class="mt-6 flex justify-end">
        <button mat-button (click)="close()">Close</button>
      </div>
    </div>
  `
})
export class BookDetailDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private ref: MatDialogRef<BookDetailDialogComponent>) {}
  close(){ this.ref.close(); }
}
