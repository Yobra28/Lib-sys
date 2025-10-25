import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  return next(req).pipe(
    // RxJS is tree-shaken in Angular 16+ functional interceptors automatically wrap errors
    // so we need to catch them via tap operator replacement using handle below
  );
};

// Angular functional interceptors require returning an observable; to handle errors succinctly
// implement a helper to catch and map errors.
import { catchError, throwError } from 'rxjs';

export const withErrorHandling: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        toastr.error('Session expired. Please login again.');
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        toastr.error('You are not authorized to perform this action.');
        router.navigate(['/unauthorized']);
      } else {
        const message = (error.error && (error.error.message || error.error.error)) || error.message || 'An error occurred';
        toastr.error(message);
      }
      return throwError(() => error);
    })
  );
};