import { HttpClient } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../shared/environment/developments';
import { RegisterRequest } from '../../model/interface/RegisterRequest';
import { LoginRequest } from '../../model/interface/LoginReques';
import { LoginResponse } from '../../model/interface/LoginResponse';
import { InvitationCheckResponse } from '../model/interface/InvitationCheckResponse';

@Injectable({
      providedIn: 'root'
})
export class AuthService {

      private apiUrl = `${environment.API_URL}/auth`;
      private isAuthenticatedSubject: BehaviorSubject<boolean>;

      constructor(
            private http: HttpClient,
            private router: Router,
            @Inject(PLATFORM_ID) private platformId: Object
      ) {
            this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
      }

      checkInvitationCode(invitationCode: string): Observable<InvitationCheckResponse> {
            return this.http.post<InvitationCheckResponse>(`${this.apiUrl}/invitation/check`, { invitationCode });
      }

      register(credentials: RegisterRequest): Observable<{ message: string }> {
            return this.http.post<{ message: string }>(`${this.apiUrl}/register`, credentials)
                  .pipe(
                        tap(response => {
                              console.log(response.message); // ✅ Access JSON field
                        })
                  );
      }




      login(credentials: LoginRequest): Observable<LoginResponse> {

            return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
                  .pipe(
                        tap(response => {
                              console.log(response.expiresIn);
                              console.log(response.token);
                              console.log(response.user);
                              console.log(response.user.roles);

                              this.setSession(response);
                              this.isAuthenticatedSubject.next(true);
                        })
                  );
      }

      setSession(authResult: LoginResponse): void {
            if (isPlatformBrowser(this.platformId)) {
                  localStorage.setItem('access_token', authResult.token);
                  localStorage.setItem('user', JSON.stringify(authResult.user));
                  const expiresAt = new Date(authResult.expiresIn).getTime();
                  localStorage.setItem('expires_at', expiresAt.toString());
            }
      }

      logout(): void {
            if (isPlatformBrowser(this.platformId)) {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('pos_token');
                  localStorage.removeItem('user');
                  localStorage.removeItem('expires_at');
            }
            this.isAuthenticatedSubject.next(false);
            this.router.navigate(['/pos/login']);
      }

      isLoggedIn(): boolean {
            return this.hasToken() && !this.isTokenExpired();
      }

      private hasToken(): boolean {
            if (isPlatformBrowser(this.platformId)) {
                  return !!localStorage.getItem('access_token');
            }
            return false;
      }

      private isTokenExpired(): boolean {
            if (isPlatformBrowser(this.platformId)) {
                  const expiration = localStorage.getItem('expires_at');
                  if (!expiration) return true;
                  return Date.now() > parseInt(expiration);
            }
            return true;
      }

      getToken(): string | null {
            if (isPlatformBrowser(this.platformId)) {
                  return localStorage.getItem('access_token');
            }
            return null;
      }

      getUser(): any {
            if (isPlatformBrowser(this.platformId)) {
                  const user = localStorage.getItem('user');
                  return user ? JSON.parse(user) : null;
            }
            return null;
      }

      get isAuthenticated$(): Observable<boolean> {
            return this.isAuthenticatedSubject.asObservable();
      }
}
