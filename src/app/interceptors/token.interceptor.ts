import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = localStorage.getItem('jwt_token');

  let clonedRequest = req;
  
  // Inject Bearer Token if available
  if (token) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedRequest).pipe(
    catchError((err) => {
      // If 401 Unauthorized occurs, clean session and force redirect to login
      if (err.status === 401) {
        authService.logout();
      }
      return throwError(() => err);
    })
  );
};
