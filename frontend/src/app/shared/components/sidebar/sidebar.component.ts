import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isAdmin = false;
  user: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.user = user;
      this.isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.LIBRARIAN;
    });
  }

  getUserRoleDisplay(): string {
    if (!this.user?.role) return 'Student';
    // Convert ADMIN, LIBRARIAN, STUDENT to Admin, Librarian, Student
    return this.user.role.charAt(0) + this.user.role.slice(1).toLowerCase();
  }

  logout() { this.authService.logout(); }
}
