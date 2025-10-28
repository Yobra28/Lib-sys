import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { UserService, User, FilterUserDto } from '../../../../core/services/user.service';
import { UserDetailDialogComponent } from './user-detail-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatPaginatorModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './users-list.component.html'
})
export class UsersListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'actions'];
  dataSource: User[] = [];
  loading = false;
  
  // Filters
  searchTerm = '';
  roleFilter: string = '';
  statusFilter: string = '';
  
  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalItems = 0;

  constructor(
    private userService: UserService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    const filters: FilterUserDto = {
      search: this.searchTerm || undefined,
      role: this.roleFilter || undefined,
      isActive: this.statusFilter === 'active' ? true : this.statusFilter === 'inactive' ? false : undefined,
      page: this.currentPage + 1,
      limit: this.pageSize
    };

    this.userService.getAll(filters).subscribe({
      next: (response) => {
        this.dataSource = response.users || [];
        this.totalItems = response.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load users');
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  applyFilters() {
    this.currentPage = 0;
    this.loadUsers();
  }

  clearFilters() {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.currentPage = 0;
    this.loadUsers();
  }

  displayName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

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

  activateUser(user: User) {
    this.userService.activate(user.id).subscribe({
      next: () => {
        this.toastr.success(`${user.firstName} ${user.lastName} activated`);
        this.loadUsers();
      },
      error: () => this.toastr.error('Failed to activate user')
    });
  }

  deactivateUser(user: User) {
    if (confirm(`Are you sure you want to deactivate ${user.firstName} ${user.lastName}?`)) {
      this.userService.deactivate(user.id).subscribe({
        next: () => {
          this.toastr.success(`${user.firstName} ${user.lastName} deactivated`);
          this.loadUsers();
        },
        error: () => this.toastr.error('Failed to deactivate user')
      });
    }
  }

  deleteUser(user: User) {
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.toastr.success('User deleted successfully');
          this.loadUsers();
        },
        error: () => this.toastr.error('Failed to delete user')
      });
    }
  }

  viewUser(user: User) {
    this.dialog.open(UserDetailDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: user
    });
  }

  editUser(user: User) {
    this.toastr.info(`Editing ${user.firstName} ${user.lastName}`);
    // TODO: Open edit user dialog
  }
}

