import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card card">
        <h2 class="text-center">تسجيل الدخول للكاشير</h2>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-md">
          <div class="form-group flex flex-col gap-sm">
            <label for="username">اسم المستخدم</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username" 
              placeholder="أدخل اسم المستخدم (admin)"
            />
          </div>
          
          <div class="form-group flex flex-col gap-sm">
            <label for="password">كلمة المرور</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              placeholder="أدخل كلمة المرور (1234)"
            />
          </div>

          <div *ngIf="error" class="error-msg">
            {{ error }}
          </div>

          <button type="submit" class="btn-primary w-full" [disabled]="loginForm.invalid">
            دخول
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: var(--bg-color);
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: var(--spacing-xl);
    }
    .login-card h2 {
      margin-bottom: var(--spacing-lg);
    }
    .error-msg {
      color: var(--error-color);
      font-size: 14px;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loginForm: FormGroup = this.fb.group({
    username: ['admin', Validators.required],
    password: ['1234', Validators.required]
  });

  error: string | null = null;

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.authService.login(username, password).subscribe(success => {
        if (!success) {
          this.error = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        }
      });
    }
  }
}
