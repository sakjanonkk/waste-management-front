import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // ดึง token จาก localStorage
  const token = localStorage.getItem('auth_token');

  // ถ้ามี token และไม่ใช่ login request และไม่ใช่ public request ให้เพิ่ม Authorization header
  // ถ้ามี token และไม่ใช่ login request
  // และไม่ใช่ Public Request (POST /requests) ให้เพิ่ม Authorization header
  const isPublicRequest =
    req.url.includes('/requests') && req.method === 'POST';

  if (token && !req.url.includes('/auth/login') && !isPublicRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // ถ้าได้ 401 Unauthorized ให้ logout แล้ว redirect ไป login
      if (error.status === 401) {
        authService.clearAccessToken();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
