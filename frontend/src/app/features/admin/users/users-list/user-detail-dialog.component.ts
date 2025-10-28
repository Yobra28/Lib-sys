import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { User } from '../../../../core/services/user.service';

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="user-detail-dialog">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800">User Details</h2>
          <button mat-icon-button (click)="dialogRef.close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div *ngIf="user" class="space-y-6">
          <!-- User Avatar and Basic Info -->
          <div class="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {{user.firstName.charAt(0)}}{{user.lastName.charAt(0)}}
            </div>
            <div class="flex-1">
              <h3 class="text-2xl font-bold text-gray-800">{{user.firstName}} {{user.lastName}}</h3>
              <p class="text-gray-600">{{user.email}}</p>
              <div class="mt-2">
                <mat-chip-set>
                  <mat-chip [class]="getRoleClass(user.role)">
                    {{user.role}}
                  </mat-chip>
                  <mat-chip [class]="getStatusClass(user.isActive)" class="ml-2">
                    {{user.isActive ? 'Active' : 'Inactive'}}
                  </mat-chip>
                </mat-chip-set>
              </div>
            </div>
          </div>

          <!-- Personal Information -->
          <mat-card class="card">
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon class="text-blue-600">person</mat-icon>
                Personal Information
              </mat-card-title>
            </mat-card-header>
            <mat-card-content class="mt-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500 mb-1">First Name</p>
                  <p class="font-medium">{{user.firstName}}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 mb-1">Last Name</p>
                  <p class="font-medium">{{user.lastName}}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 mb-1">Email</p>
                  <p class="font-medium">{{user.email}}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 mb-1">Phone</p>
                  <p class="font-medium">{{user.phone || 'Not provided'}}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-sm text-gray-500 mb-1">Address</p>
                  <p class="font-medium">{{user.address || 'Not provided'}}</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Account Information -->
          <mat-card class="card">
            <mat-card-header>
              <mat-card-title class="flex items-center gap-2">
                <mat-icon class="text-green-600">account_circle</mat-icon>
                Account Information
              </mat-card-title>
            </mat-card-header>
            <mat-card-content class="mt-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500 mb-1">User ID</p>
                  <p class="font-mono text-sm text-gray-700">{{user.id}}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 mb-1">Role</p>
                  <mat-chip-set>
                    <mat-chip [class]="getRoleClass(user.role)">
                      {{user.role}}
                    </mat-chip>
                  </mat-chip-set>
                </div>
                <div>
                  <p class="text-sm text-gray-500 mb-1">Status</p>
                  <mat-chip-set>
                    <mat-chip [class]="getStatusClass(user.isActive)">
                      {{user.isActive ? 'Active' : 'Inactive'}}
                    </mat-chip>
                  </mat-chip-set>
                </div>
                <div>
                  <p class="text-sm text-gray-500 mb-1">Account Created</p>
                  <p class="font-medium">{{user.createdAt | date:'medium'}}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p class="font-medium">{{user.updatedAt | date:'medium'}}</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-4 border-t">
            <button mat-button (click)="dialogRef.close()">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-detail-dialog {
      min-width: 600px;
      max-width: 800px;
    }
    .card {
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
  `]
})
export class UserDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UserDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public user: User
  ) {}

  getRoleClass(role: string): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      case 'LIBRARIAN':
        return 'bg-blue-100 text-blue-700';
      case 'STUDENT':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  }
}

