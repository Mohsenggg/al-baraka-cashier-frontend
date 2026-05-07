import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
      private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());

      constructor(private http: HttpClient) { }

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
            // Store tokens in localStorage or sessionStorage
            localStorage.setItem('access_token', authResult.token);


            // localStorage.setItem('refresh_token', authResult.refreshToken);
            localStorage.setItem('user', JSON.stringify(authResult.user));

            // Set token expiration

            const expiresAt = new Date(authResult.expiresIn).getTime();
            localStorage.setItem('expires_at', expiresAt.toString());
            console.log(authResult.expiresIn);
            console.log(expiresAt);

      }





      logout(): void {
            // Remove tokens and user data
            localStorage.removeItem('access_token');
            // localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            localStorage.removeItem('expires_at');

            this.isAuthenticatedSubject.next(false);
      }

      isLoggedIn(): boolean {
            return this.hasToken() && !this.isTokenExpired();
      }

      private hasToken(): boolean {
            return !!localStorage.getItem('access_token');
      }

      private isTokenExpired(): boolean {
            const expiration = localStorage.getItem('expires_at');
            if (!expiration) return true;

            return Date.now() > parseInt(expiration);
      }

      getToken(): string | null {
            return localStorage.getItem('access_token');
      }

      getUser(): any {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
      }

      get isAuthenticated$(): Observable<boolean> {
            return this.isAuthenticatedSubject.asObservable();
      }
}
