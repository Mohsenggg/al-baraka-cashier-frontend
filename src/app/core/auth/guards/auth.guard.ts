import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // If not logged in, authService.logout() will handle state clearing and redirection,
  // but just to be safe, we also return a UrlTree or false.
  authService.logout();
  return false;
};
