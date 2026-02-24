import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';  // ← yeh import karna zaroori

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class AdminLoginComponent {

  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login() {
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Email aur password dono bharna zaroori hai';
      return;
    }

    this.loading = true;
    this.error = '';

    const payload = { 
      email: this.email.trim(), 
      password: this.password.trim() 
    };

    // ← environment se URL le rahe hain
    this.http.post<any>(`${environment.apiUrl}/admin/login`, payload).subscribe({
      next: (res) => {
        localStorage.setItem('admin_token', res.token);
        localStorage.setItem('admin_email', res.email || this.email); // optional
        this.loading = false;
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Login failed – galat email ya password';
        console.error('Login error:', err);
      }
    });
  }
}   