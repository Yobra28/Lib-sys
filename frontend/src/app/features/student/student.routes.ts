import { Routes } from '@angular/router';
import { StudentLayoutComponent } from './student-layout/student-layout.component';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    component: StudentLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/student-dashboard/student-dashboard.component')
          .then(m => m.StudentDashboardComponent)
      },
      {
        path: 'books',
        loadComponent: () => import('./books/student-books/student-books.component')
          .then(m => m.StudentBooksComponent)
      },
      {
        path: 'my-borrows',
        loadComponent: () => import('./my-borrows/my-borrows.component')
          .then(m => m.MyBorrowsComponent)
      },
      {
        path: 'seat-reservation',
        loadComponent: () => import('./seat-reservation/seat-reservation/seat-reservation.component')
          .then(m => m.SeatReservationComponent)
      },
      {
        path: 'my-fines',
        loadComponent: () => import('./my-fines/my-fines/my-fines.component')
          .then(m => m.MyFinesComponent)
      },
      {
        path: 'feedback',
        loadComponent: () => import('./feedback/student-feedback/student-feedback.component')
          .then(m => m.StudentFeedbackComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notifications/notifications.component')
          .then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component')
          .then(m => m.ProfileComponent)
      },
      { path: '', pathMatch: 'full', redirectTo: 'books' }
    ]
  }
];
