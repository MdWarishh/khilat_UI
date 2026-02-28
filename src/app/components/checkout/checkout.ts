// src/app/components/checkout/checkout.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../services/cart.service';
import { GuestService } from '../../services/guest.service';
import { environment } from '../../../environments/environments';

// Stripe types
declare var Stripe: any;

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
export class Checkout implements OnInit, AfterViewInit, OnDestroy {

  cartItems: CartItem[] = [];
  subtotal = 0;
  shipping = 0;
  total    = 0;

  form: CheckoutForm = {
    fullName: '', email: '', phone: '',
    addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: ''
  };

  // UI state
  formSubmitted  = false;
  loading        = false;
  errorMessage   = '';

  // Step management
  // step 1 = form, step 2 = stripe payment
  currentStep: 1 | 2 = 1;

  // Stripe
  private stripe:        any = null;
  private elements:      any = null;
  private paymentElement: any = null;
  stripeLoading = false;
  stripeReady   = false;

  private cartSub!: Subscription;

  constructor(
    private cartService:  CartService,
    private guestService: GuestService,
    private http:         HttpClient,
    private router:       Router,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit(): void {
    this.cartSub = this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });

    // Fetch fresh cart from backend
    this.cartService.fetchCart().subscribe();

    if (this.cartService.getTotalCount() === 0) {
      this.router.navigate(['/products']);
    }
  }

  ngAfterViewInit(): void {
    // Load Stripe.js script dynamically if not already loaded
    this.loadStripeScript();
  }

  ngOnDestroy(): void {
    if (this.cartSub) this.cartSub.unsubscribe();
  }

  // ── Step 1: Form submit → create payment intent ───────────────

  onSubmit(): void {
    this.formSubmitted = true;
    this.errorMessage  = '';

    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    this.loading = true;

    // Call backend to create Stripe PaymentIntent
    const payload = {
      guestId:  this.guestService.getGuestId(),
      currency: 'inr',
      name:     this.form.fullName,
      address:  `${this.form.addressLine1}${this.form.addressLine2 ? ', ' + this.form.addressLine2 : ''}, ${this.form.city}, ${this.form.state} - ${this.form.pincode}`,
      email:    this.form.email,
      phone:    this.form.phone,
    };

    this.http.post<{ clientSecret: string }>(
      `${environment.apiUrl}/checkout/create-payment-intent`, payload
    ).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.clientSecret) {
          this.currentStep = 2;
          // Init Stripe payment element after DOM renders
          setTimeout(() => this.initStripeElement(res.clientSecret), 100);
        } else {
          this.errorMessage = 'Could not initiate payment. Try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error || 'Something went wrong. Please try again.';
        console.error('Checkout error:', err);
      },
    });
  }

  // ── Step 2: Stripe payment confirm ───────────────────────────

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.elements) return;

    this.stripeLoading = true;
    this.errorMessage  = '';

    const { error } = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-success`,
        payment_method_data: {
          billing_details: {
            name:  this.form.fullName,
            email: this.form.email,
            phone: this.form.phone,
            address: {
              line1:       this.form.addressLine1,
              line2:       this.form.addressLine2 || '',
              city:        this.form.city,
              state:       this.form.state,
              postal_code: this.form.pincode,
              country:     'IN',
            },
          },
        },
      },
    });

    // If error (user cancelled, card declined etc.)
    if (error) {
      this.stripeLoading = false;
      this.errorMessage  = error.message || 'Payment failed. Please try again.';
    }
    // On success, Stripe redirects to return_url automatically
  }

  goBackToForm(): void {
    this.currentStep   = 1;
    this.errorMessage  = '';
    this.stripeLoading = false;
  }

  // ── Stripe setup ─────────────────────────────────────────────

  private loadStripeScript(): void {
    if ((window as any).Stripe) return; // Already loaded
    const script  = document.createElement('script');
    script.src    = 'https://js.stripe.com/v3/';
    script.async  = true;
    document.head.appendChild(script);
  }

  private initStripeElement(clientSecret: string): void {
    if (!(window as any).Stripe) {
      this.errorMessage = 'Stripe failed to load. Please refresh.';
      return;
    }

    // Replace with your actual Stripe publishable key
    this.stripe   = (window as any).Stripe(environment.stripePublishableKey);
    this.elements = this.stripe.elements({ clientSecret, appearance: { theme: 'stripe' } });

    this.paymentElement = this.elements.create('payment');
    this.paymentElement.mount('#stripe-payment-element');

    this.paymentElement.on('ready', () => {
      this.stripeReady = true;
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  private calculateTotals(): void {
    this.subtotal = this.cartService.getTotalPrice();
    this.shipping = this.subtotal >= 999 ? 0 : 99;
    this.total    = this.subtotal + this.shipping;
  }

  private isFormValid(): boolean {
    return !!(
      this.form.fullName &&
      this.form.email && this.isValidEmail(this.form.email) &&
      this.form.phone && this.isValidPhone(this.form.phone) &&
      this.form.addressLine1 &&
      this.form.city &&
      this.form.state &&
      this.form.pincode && this.form.pincode.length === 6
    );
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone: string): boolean {
    return /^\d{10}$/.test(phone);
  }

  // ── Cart display helpers ──────────────────────────────────────

  getProductName(item: CartItem): string {
    return item.product?.name ?? '';
  }

  getProductQty(item: CartItem): number {
    return item.quantity ?? 0;
  }

  getItemTotal(item: CartItem): number {
    return item.price * item.quantity;
  }
}