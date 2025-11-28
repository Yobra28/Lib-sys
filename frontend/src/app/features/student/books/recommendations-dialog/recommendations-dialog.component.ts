import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-recommendations-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="w-[680px] max-w-full">
      <h2 class="text-xl font-semibold text-slate-800 mb-4">You might also like</h2>

      <div *ngIf="!data?.books?.length" class="text-sm text-slate-500">No recommendations available right now.</div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" *ngIf="data?.books?.length">
        <mat-card *ngFor="let book of data.books" class="hover:shadow-md transition">
          <mat-card-content>
            <div class="flex items-start gap-3">
              <div class="w-14 h-20 bg-slate-100 grid place-items-center rounded">
                <mat-icon>book</mat-icon>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium truncate">{{book.title}}</h3>
                <p class="text-sm text-slate-600 truncate">{{book.author}}</p>
                <p class="text-xs text-slate-500 truncate">{{book.category}}</p>
                <div *ngIf="book.aiReason" class="mt-2 p-2 bg-indigo-50 rounded text-xs text-slate-700 italic border-l-2 border-indigo-400">
                  <span class="font-semibold">🤖 AI:</span> {{book.aiReason}}
                </div>
                <div class="mt-3 flex gap-2">
                  <button mat-stroked-button (click)="select(book)" [disabled]="book.availableCopies === 0">
                    <mat-icon>add</mat-icon>
                    Borrow
                  </button>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="mt-6 flex justify-end">
        <button mat-button (click)="close()">Close</button>
      </div>
    </div>
  `
})
export class RecommendationsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private ref: MatDialogRef<RecommendationsDialogComponent>) {}
  close(){ this.ref.close(); }
  select(book: any){ this.ref.close({ book }); }
}