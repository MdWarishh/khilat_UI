// src/app/components/checkout/checkout.component.ts
import {
  Component, OnInit, OnDestroy,
  AfterViewInit, NgZone, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../services/cart.service';
import { GuestService } from '../../services/guest.service';
import { environment } from '../../../environments/environments';

declare var Stripe: any;

interface CheckoutForm {
  fullName:      string;
  email:         string;
  phone:         string;
  addressLine1:  string;
  addressLine2?: string;
  city:          string;
  state:         string;
  pincode:       string;
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

  formSubmitted = false;
  loading       = false;
  errorMessage  = '';
  currentStep: 1 | 2 = 1;

  // ── Stripe state ─────────────────────────────────────────────
  private stripe:         any = null;
  private elements:       any = null;
  private paymentElement: any = null;
  private stripeMounted       = false;

  stripeLoading = false;
  stripeReady   = false;

  private cartSub!: Subscription;

  constructor(
    private cartService:  CartService,
    private guestService: GuestService,
    private http:         HttpClient,
    private router:       Router,
    private ngZone:       NgZone,
    private cdr:          ChangeDetectorRef,
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────

  ngOnInit(): void {
    this.cartSub = this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });

    if (this.cartService.getTotalCount() === 0) {
      this.router.navigate(['/cart']);
    }
  }

  ngAfterViewInit(): void {
    this.loadStripeScript();
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
    this.destroyStripeElement();
  }

  // ── Step 1: Shipping form submit ─────────────────────────────

  onSubmit(): void {
    this.formSubmitted = true;
    this.errorMessage  = '';

    if (!this.isFormValid()) {
      this.errorMessage = 'Please fill all required fields correctly.';
      return;
    }

    this.loading = true;

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

        if (!res?.clientSecret) {
          this.errorMessage = 'Could not initiate payment. Please try again.';
          return;
        }

        this.currentStep = 2;
        this.cdr.detectChanges();

        if (!this.stripeMounted) {
          setTimeout(() => this.initStripeElement(res.clientSecret), 150);
        }
      },
      error: (err) => {
        this.loading      = false;
        this.errorMessage = err?.error?.message || err?.error || 'Something went wrong. Please try again.';
      },
    });
  }

  // ── Step 2: Stripe payment confirm ──────────────────────────

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.elements) return;

    this.stripeLoading = true;
    this.errorMessage  = '';

    const { error: submitError } = await this.elements.submit();
    if (submitError) {
      this.stripeLoading = false;
      this.errorMessage  = submitError.message || 'Please check your payment details.';
      return;
    }

    const { error, paymentIntent } = await this.stripe.confirmPayment({
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
      redirect: 'if_required',
    });

    this.ngZone.run(() => {
      this.stripeLoading = false;

      if (error) {
        this.errorMessage = error.message || 'Payment failed. Please try again.';
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Cart clear karo payment ke baad
        this.cartService.clearCart().subscribe();
        this.router.navigate(['/order-success'], {
          queryParams: {
            payment_intent: paymentIntent.id,
            status:         'succeeded'
          }
        });
      } else {
        this.errorMessage = 'Payment could not be completed. Please try again.';
      }
    });
  }

  goBackToForm(): void {
    this.currentStep   = 1;
    this.errorMessage  = '';
    this.stripeLoading = false;
    this.destroyStripeElement();
    this.cdr.detectChanges();
  }

  // ── Stripe Setup ─────────────────────────────────────────────

  private loadStripeScript(): void {
    if ((window as any).Stripe) return;
    const script = document.createElement('script');
    script.src   = 'https://js.stripe.com/v3/';
    script.async = true;
    document.head.appendChild(script);
  }

  private initStripeElement(clientSecret: string): void {
    if (this.stripeMounted) return;

    if (!(window as any).Stripe) {
      setTimeout(() => this.initStripeElement(clientSecret), 300);
      return;
    }

    const container = document.getElementById('stripe-payment-element');
    if (!container) {
      setTimeout(() => this.initStripeElement(clientSecret), 200);
      return;
    }

    this.stripeMounted = true;

    this.stripe   = (window as any).Stripe(environment.stripePublishableKey);
    this.elements = this.stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary:    '#1C1C1C',
          colorBackground: '#ffffff',
          colorText:       '#1C1C1C',
          colorDanger:     '#dc2626',
          fontFamily:      'DM Sans, sans-serif',
          borderRadius:    '10px',
        }
      }
    });

    this.paymentElement = this.elements.create('payment', { layout: 'tabs' });
    this.paymentElement.mount('#stripe-payment-element');
    this.paymentElement.on('ready', () => {
      this.ngZone.run(() => {
        this.stripeReady = true;
        this.cdr.detectChanges();
      });
    });
  }

  private destroyStripeElement(): void {
    if (this.paymentElement) {
      this.paymentElement.destroy();
      this.paymentElement = null;
    }
    this.stripe        = null;
    this.elements      = null;
    this.stripeMounted = false;
    this.stripeReady   = false;
  }

  // ── Helpers ──────────────────────────────────────────────────

  private calculateTotals(): void {
    this.subtotal = this.cartService.getTotalPrice();
    this.shipping = this.subtotal >= 999 ? 0 : 99;
    this.total    = +(this.subtotal + this.shipping).toFixed(2);
  }

  private isFormValid(): boolean {
    return !!(
      this.form.fullName?.trim() &&
      this.form.email?.trim()    && this.isValidEmail(this.form.email) &&
      this.form.phone?.trim()    && this.isValidPhone(this.form.phone) &&
      this.form.addressLine1?.trim() &&
      this.form.city?.trim() &&
      this.form.state?.trim() &&
      this.form.pincode?.trim() && this.form.pincode.length === 6
    );
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone: string): boolean {
    return /^\d{10}$/.test(phone);
  }

  getItemTotal(item: CartItem): string {
    return (item.currentPrice * item.quantity).toFixed(2);
  }
}