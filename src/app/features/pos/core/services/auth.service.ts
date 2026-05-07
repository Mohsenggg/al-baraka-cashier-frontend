import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn = false;
  private http = inject(HttpClient);
  private router = inject(Router);

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { username, password }).pipe(
      tap(res => {
        if (res && res.token) {
          this.loggedIn = true;
          localStorage.setItem('pos_token', res.token);
          this.router.navigate(['/pos/cashier']);
        }
      }),
      map(res => !!res.token),
      catchError(() => {
        this.loggedIn = false;
        return of(false);
      })
    );
  }

  logout(): void {
    this.loggedIn = false;
    localStorage.removeItem('pos_token');
    this.router.navigate(['/pos/login']);
  }

  isLoggedIn(): boolean {
    return this.loggedIn || !!localStorage.getItem('pos_token');
  }
}
