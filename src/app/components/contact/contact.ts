import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
//   styleUrl: './contact.scss'
})
export class Contact {
  name: string = '';
  email: string = '';
  message: string = '';

  onSubmit() {
    // placeholder – later connect to real service / API
    console.log('Contact form:', { name: this.name, email: this.email, message: this.message });
    alert('Thank you! We will get back to you soon.');
    this.name = this.email = this.message = '';
  }
}