// src/app/components/checkout/checkout.component.ts
import {
  Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }   from '@angular/common';
import { Router }         from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { Subscription }   from 'rxjs';

import { CartService, CartItem } from '../../services/cart.service';
import { GuestService }          from '../../services/guest.service';
import { environment }           from '../../../environments/environments';

import { CheckoutStepsComponent }   from './checkout-steps/checkout-steps.component';
import { ShippingFormComponent }    from './shipping-form/shipping-form.component';
import { PaymentFormComponent }     from './payment-form/payment-form.component';
import { OrderSummaryComponent }    from './order-summary/order-summary.component';

export interface CheckoutForm {
  fullName:      string;
  email:         string;
  phone:         string;
  addressLine1:  string;
  addressLine2?: string;
  city:          string;
  state:         string;
  pincode:       string;
}

declare var Stripe: any;

@Component({
  selector:    'app-checkout',
  standalone:  true,
  imports: [
    CommonModule,
    CheckoutStepsComponent,
    ShippingFormComponent,
    PaymentFormComponent,
    OrderSummaryComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrl:    './checkout.component.css',
})
export class Checkout implements OnInit, OnDestroy {

  // Cart
  cartItems: CartItem[] = [];
  subtotal  = 0;
  shipping  = 0;
  total     = 0;

  // Form state (shared across steps)
  form: CheckoutForm = {
    fullName: '', email: '', phone: '',
    addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '',
  };

  currentStep: 1 | 2 = 1;
  errorMessage       = '';
  loading            = false;   // step 1 loading (creating payment intent)

  // Stripe — owned here, passed to PaymentFormComponent
  clientSecret = '';

  private cartSub!: Subscription;

  constructor(
    private cartService:  CartService,
    private guestService: GuestService,
    private http:         HttpClient,
    private router:       Router,
    public  ngZone:       NgZone,
    public  cdr:          ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cartSub = this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });

    // Redirect if cart is empty
    if (this.cartService.getTotalCount() === 0) {
      this.router.navigate(['/cart']);
    }

    // Preload Stripe script early
    this.preloadStripe();
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  // ── Step 1: Shipping submitted → create payment intent ──────

  onShippingSubmitted(formData: CheckoutForm): void {
    this.form         = formData;
    this.errorMessage = '';
    this.loading      = true;

    const payload = {
      guestId:  this.guestService.getGuestId(),
      currency: 'inr',
      name:     this.form.fullName,
      address:  this.buildAddress(),
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
        this.clientSecret = res.clientSecret;
        this.currentStep  = 2;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading      = false;
        this.errorMessage = err?.error?.message || err?.error || 'Something went wrong. Please try again.';
      },
    });
  }

  // ── Step 2: Payment result from PaymentFormComponent ────────

  onPaymentSuccess(paymentIntentId: string): void {
    this.cartService.clearCart().subscribe();
    this.router.navigate(['/order-success'], {
      queryParams: { payment_intent: paymentIntentId, status: 'succeeded' }
    });
  }

  onPaymentFailed(message: string): void {
    this.errorMessage = message;
    this.cdr.detectChanges();
  }

  goBackToShipping(): void {
    this.currentStep  = 1;
    this.errorMessage = '';
    this.clientSecret = ''; // force fresh secret on retry
    this.cdr.detectChanges();
  }

  // ── Helpers ──────────────────────────────────────────────────

  private buildAddress(): string {
    const { addressLine1, addressLine2, city, state, pincode } = this.form;
    return `${addressLine1}${addressLine2 ? ', ' + addressLine2 : ''}, ${city}, ${state} - ${pincode}`;
  }

  private calculateTotals(): void {
    this.subtotal = this.cartService.getTotalPrice();
    this.shipping = this.subtotal >= 999 ? 0 : 99;
    this.total    = +(this.subtotal + this.shipping).toFixed(2);
  }

  private preloadStripe(): void {
    if ((window as any).Stripe) return;
    const s = document.createElement('script');
    s.src   = 'https://js.stripe.com/v3/';
    s.async = true;
    document.head.appendChild(s);
  }
}