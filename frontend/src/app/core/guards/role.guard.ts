import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUserValue;
  const allowed: UserRole[] = route.data?.['roles'] ?? [];

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (allowed.length === 0 || allowed.includes(user.role as UserRole)) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};
