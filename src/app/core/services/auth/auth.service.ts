import { inject, Injectable, signal, computed, effect, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { filter, tap, catchError, throwError } from 'rxjs';
import { UserService } from '../user/user.service';
import { environment } from '../../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: any;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private jwt = inject(JwtHelperService);
  private userService = inject(UserService);

  // Always use relative path to let proxy handle the backend routing
  private baseUrl = '/api/v1/auth';

  // Signals
  accessToken = signal<string>('');
  isAccessTokenLoaded = signal(false);
  isAccessTokenGranted = signal(false);
  isSignedOut = signal(false);

  // Computed: Check if token is expired
  isTokenExpired = computed(() => {
    const token = this.accessToken();
    try {
      const expired = this.jwt.isTokenExpired(token);
      if (expired) localStorage.removeItem('auth_token');
      return !!token && expired;
    } catch {
      return true;
    }
  });

  // Computed: Decode user from token
  user = computed(() => {
    const token = this.accessToken();
    if (!token) return undefined;
    try { return this.jwt.decodeToken(token); } catch { return undefined; }
  });

  constructor() {
    // Effect to manage token lifecycle
    effect(() => {
      const token = this.accessToken();
      const expired = untracked(this.isTokenExpired);
      const signedOut = untracked(this.isSignedOut);

      // Reload user data on navigation if logged in
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        if (this.isLoggedIn()) this.userService.getUserMe().subscribe();
      });

      if (token && !expired) {
        this.userService.getUserMe().subscribe();
      } else if (expired && !signedOut) {
        this.clearAccessToken();
        this.router.navigate(['/login']);
      }
    });

    // Initial load
    this.loadAccessToken();
  }

  setAccessToken(token: string) {
    this.accessToken.set(token);
    localStorage.setItem('auth_token', token);
    this.isAccessTokenGranted.set(true);
    this.isAccessTokenLoaded.set(true);
  }

  loadAccessToken() {
    const token = localStorage.getItem('auth_token') ?? '';
    this.accessToken.set(token);
    this.isAccessTokenLoaded.set(true);
    if (token && !this.jwt.isTokenExpired(token)) {
      this.isAccessTokenGranted.set(true);
    }
  }

  clearAccessToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user'); // Also clear legacy user data
    queueMicrotask(() => this.accessToken.set(''));
  }

  signOut() {
    this.clearAccessToken();
    this.isSignedOut.set(true);
    this.isAccessTokenGranted.set(false);
    this.router.navigate(['/login']).then(() => window.location.reload());
  }

  login(credentials: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data.token) {
          this.setAccessToken(response.data.token);
        }
      })
    );
  }

  // --- Compatibility Methods ---

  logout(): void {
    this.signOut();
  }

  getToken(): string | null {
    return this.accessToken() || null;
  }

  isLoggedIn(): boolean {
    return !!this.accessToken() && !this.jwt.isTokenExpired(this.accessToken());
  }

  getCurrentUser(): any {
    return this.user();
  }
}
