// admin/login/login.component.ts
import { Component }     from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient }    from '@angular/common/http';
import { environment }   from '../../../environments/environments';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl:    './login.component.css'
})
export class AdminLoginComponent {

  email    = '';
  password = '';
  error    = '';
  loading  = false;

  // UI state
  showPassword    = false;
  emailTouched    = false;
  passwordTouched = false;

  constructor(
    private http:   HttpClient,
    private router: Router
  ) {}

  login(): void {
    // Touch both fields to show validation
    this.emailTouched    = true;
    this.passwordTouched = true;

    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Please fill in all fields';
      return;
    }

    this.loading = true;
    this.error   = '';

    this.http.post<{ token: string; email?: string }>(
      `${environment.apiUrl}/admin/login`,
      { email: this.email.trim(), password: this.password.trim() }
    ).subscribe({
      next: (res) => {
        localStorage.setItem('admin_token', res.token);
        if (res.email) localStorage.setItem('admin_email', res.email);
        this.loading = false;
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.error?.message || 'Invalid email or password. Please try again.';
      }
    });
  }
}