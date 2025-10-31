import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/admin-dashboard/admin-dashboard.component')
          .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'books',
        loadComponent: () => import('./books/books-list/books-list.component')
          .then(m => m.BooksListComponent)
      },
      {
        path: 'books/new',
        loadComponent: () => import('./books/book-create/book-create.component')
          .then(m => m.BookCreateComponent)
      },
      {
        path: 'books/:id/edit',
        loadComponent: () => import('./books/book-edit/book-edit.component')
          .then(m => m.BookEditComponent)
      },
      {
        path: 'borrows',
        loadComponent: () => import('./borrows/borrows-list/borrows-list.component')
          .then(m => m.BorrowsListComponent)
      },
      {
        path: 'seats',
        loadComponent: () => import('./seats/seats-list/seats-list.component')
          .then(m => m.SeatsListComponent)
      },
      {
        path: 'seats/layout',
        loadComponent: () => import('./seats/seat-layout/seat-layout.component')
          .then(m => m.SeatLayoutComponent)
      },
      {
        path: 'reservations',
        loadComponent: () => import('./reservations/reservations-list/reservations-list.component')
          .then(m => m.ReservationsListComponent)
      },
      {
        path: 'fines',
        loadComponent: () => import('./fines/fines-list/fines-list.component')
          .then(m => m.FinesListComponent)
      },
      {
        path: 'feedback',
        loadComponent: () => import('./feedback/feedback-list/feedback-list.component')
          .then(m => m.FeedbackListComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports/reports.component')
          .then(m => m.ReportsComponent)
      },
      {
        path: 'logs',
        loadComponent: () => import('./logs/logs-list/logs-list.component')
          .then(m => m.LogsListComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component')
          .then(m => m.SettingsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users-list/users-list.component')
          .then(m => m.UsersListComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  }
];
