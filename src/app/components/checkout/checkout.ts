// src/app/components/checkout/checkout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../services/cart.service';

interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements OnInit, OnDestroy {

  cartItems: CartItem[] = [];
  subtotal = 0;
  shipping = 0;
  total = 0;

  form: CheckoutForm = {
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  };

  formSubmitted = false;
  loading = false;
  errorMessage = '';

  private cartSub!: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartSub = this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });

    // Agar cart khali hai to products pe redirect
    if (this.cartService.getTotalCount() === 0) {
      this.router.navigate(['/products']);
    }
  }

  ngOnDestroy(): void {
    if (this.cartSub) this.cartSub.unsubscribe();
  }

  private calculateTotals(): void {
    this.subtotal = this.cartService.getTotalPrice();
    this.shipping = this.subtotal >= 999 ? 0 : 99;
    this.total = this.subtotal + this.shipping;
  }

  onSubmit(): void {
    this.formSubmitted = true;

    // Basic validation
    if (!this.form.fullName || !this.form.email || !this.form.phone ||
        !this.form.addressLine1 || !this.form.city || !this.form.state ||
        !this.form.pincode || this.form.pincode.length !== 6) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    if (!this.isValidEmail(this.form.email)) {
      this.errorMessage = 'Please enter a valid email';
      return;
    }

    if (!this.isValidPhone(this.form.phone)) {
      this.errorMessage = 'Please enter a valid 10-digit phone number';
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    // Yahan real backend call hoga (OrderService.createOrder)
    // Abhi simulate kar rahe hain
    setTimeout(() => {
      this.loading = false;
      // Success hone pe payment page pe redirect
      this.router.navigate(['/payment'], {
        state: {
          orderData: {
            items: this.cartItems,
            subtotal: this.subtotal,
            shipping: this.shipping,
            total: this.total,
            customer: { ...this.form }
          }
        }
      });
    }, 1500);
  }

isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

 isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}
}