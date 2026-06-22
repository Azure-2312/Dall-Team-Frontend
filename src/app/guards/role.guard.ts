import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

const checkRoleAccess = (authService: AuthService, router: Router, allowedRoles: Array<string>): boolean => {
  const user = authService.currentUser();
  if (user) {
    if (allowedRoles.length === 0 || allowedRoles.includes(user.rol)) {
      return true;
    } else {
      // Forbidden: redirect to role's dashboard
      if (user.rol === 'Admin') {
        router.navigate(['/admin/dashboard']);
      } else if (user.rol === 'Docente') {
        router.navigate(['/docente/dashboard']);
      } else {
        router.navigate(['/student/dashboard']);
      }
      return false;
    }
  }

  // Not authenticated
  router.navigate(['/login']);
  return false;
};

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data ? (route.data['roles'] as Array<string>) : [];

  if (authService.restoringSession()) {
    return toObservable(authService.restoringSession).pipe(
      filter(restoring => !restoring),
      take(1),
      map(() => checkRoleAccess(authService, router, allowedRoles))
    );
  }

  return checkRoleAccess(authService, router, allowedRoles);
};
