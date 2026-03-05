// src/app/components/checkout/shipping-form/shipping-form.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { CheckoutForm } from '../checkout.component';

@Component({
  selector:    'app-shipping-form',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './shipping-form.component.html',
  styleUrl:    './shipping-form.component.css',
})
export class ShippingFormComponent {
  @Input()  form!:    CheckoutForm;
  @Input()  loading   = false;
  @Output() formSubmitted = new EventEmitter<CheckoutForm>();

  submitted = false;

  onSubmit(): void {
    this.submitted = true;
    if (!this.isValid()) return;
    this.formSubmitted.emit({ ...this.form });
  }

  isValid(): boolean {
    return !!(
      this.form.fullName?.trim()     &&
      this.form.email?.trim()        && this.isValidEmail(this.form.email) &&
      this.form.phone?.trim()        && this.isValidPhone(this.form.phone) &&
      this.form.addressLine1?.trim() &&
      this.form.city?.trim()         &&
      this.form.state?.trim()        &&
      this.form.pincode?.trim()      && this.form.pincode.length === 6
    );
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone: string): boolean {
    return /^\d{10}$/.test(phone);
  }

  // Helpers for template
  invalid(field: string, extra?: () => boolean): boolean {
    if (!this.submitted) return false;
    if (extra) return extra();
    return !(this.form as any)[field]?.trim();
  }
}