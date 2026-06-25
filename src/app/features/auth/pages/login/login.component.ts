import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginRequest } from '../../../../core/model/interface/LoginReques';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';

@Component({
      selector: 'app-login',
      standalone: true,
      imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterLink],
      templateUrl: './login.component.html',
      styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
      loginForm: FormGroup;
      isLoading = false;
      errorMessage = '';
      showPassword = false;
      readonly currentYear = new Date().getFullYear();

      constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private http: HttpClient) {

            this.loginForm = this.fb.group({
                  username: ['', Validators.required],
                  password: ['', Validators.required],
                  rememberMe: [false]
            });

      }

      ngOnInit(): void {
            // Check if user is already logged in
            if (this.authService.isLoggedIn()) {
                  this.router.navigate(['/home']);
            }
      }

      onSubmit(): void {
            if (this.loginForm.invalid) {
                  this.markFormGroupTouched();
                  return;
            }

            this.isLoading = true;
            this.errorMessage = '';

            const loginData: LoginRequest = {
                  username: this.loginForm.value.username,
                  password: this.loginForm.value.password,
                  rememberMe: this.loginForm.value.rememberMe
            };

            this.authService.login(loginData).subscribe({

                  next: (response) => {
                        this.isLoading = false;

                        // Store tokens and user data
                        this.authService.setSession(response);

                        // Redirect based on user role or to default page
                        this.redirectAfterLogin(response.user);

                  },
                  error: (error) => {
                        this.isLoading = false;

                        if (error.status === 401) {
                              this.errorMessage = 'Invalid username or password';
                        } else if (error.status === 403) {
                              this.errorMessage = 'Account is disabled or locked';
                        } else if (error.status === 0) {
                              this.errorMessage = 'Cannot connect to server. Please try again later.';
                        } else {
                              this.errorMessage = 'An error occurred during login. Please try again.';
                        }

                        console.error('Login error:', error);
                  }
            });
      }


      togglePassword(): void {
            this.showPassword = !this.showPassword;
      }

      private markFormGroupTouched(): void {
            Object.keys(this.loginForm.controls).forEach(key => {
                  this.loginForm.get(key)?.markAsTouched();
            });
      }

      private redirectAfterLogin(user: any): void {
            // Redirect based on user role or to default page
            const defaultRoute = '/home';
            this.router.navigate([defaultRoute]);
      }

      // Helper methods for form controls
      get username() { return this.loginForm.get('username'); }
      get password() { return this.loginForm.get('password'); }
}