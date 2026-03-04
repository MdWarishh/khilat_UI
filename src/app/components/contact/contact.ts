// contact/contact.component.ts
import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class Contact implements AfterViewInit {
  name    = '';
  email   = '';
  subject = '';
  message = '';
  sending   = false;
  submitted = false;

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  onSubmit(): void {
    if (this.sending) return;
    this.sending = true;

    // Simulate API call — replace with real service later
    setTimeout(() => {
      console.log('Contact form:', {
        name:    this.name,
        email:   this.email,
        subject: this.subject,
        message: this.message
      });
      this.sending   = false;
      this.submitted = true;
    }, 1400);
  }

  resetForm(): void {
    this.name      = '';
    this.email     = '';
    this.subject   = '';
    this.message   = '';
    this.submitted = false;
  }
}