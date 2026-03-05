// src/app/components/checkout/payment-form/payment-form.component.ts
import {
  Component, Input, Output, EventEmitter,
  OnDestroy, AfterViewInit, NgZone, ChangeDetectorRef
} from '@angular/core';
import { CommonModule }  from '@angular/common';
import { CheckoutForm }  from '../checkout.component';
import { environment }   from '../../../../environments/environments';

declare var Stripe: any;

export type ErrorType = 'declined' | 'validation' | 'generic' | null;

@Component({
  selector:    'app-payment-form',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './payment-form.component.html',
  styleUrl:    './payment-form.component.css',
})
export class PaymentFormComponent implements AfterViewInit, OnDestroy {

  @Input()  form!:         CheckoutForm;
  @Input()  clientSecret!: string;
  @Input()  total          = 0;

  @Output() goBack         = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<string>();
  @Output() paymentFailed  = new EventEmitter<string>();

  stripeReady   = false;
  stripeLoading = false;
  errorMessage  = '';
  errorType:    ErrorType = null;

  private stripe:         any = null;
  private elements:       any = null;
  private paymentElement: any = null;
  private mounted         = false;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void { this.initStripe(); }

  ngOnDestroy(): void { this.destroyStripe(); }

  // ── Init Stripe ──────────────────────────────────────────────

  private initStripe(): void {
    if (this.mounted) return;
    const tryMount = () => {
      if (!(window as any).Stripe) { setTimeout(tryMount, 300); return; }
      const container = document.getElementById('stripe-payment-element');
      if (!container) { setTimeout(tryMount, 200); return; }
      this.mountElements();
    };
    setTimeout(tryMount, 150);
  }

  private mountElements(): void {
    if (this.mounted) return;
    this.mounted = true;

    this.stripe   = (window as any).Stripe(environment.stripePublishableKey);
    this.elements = this.stripe.elements({
      clientSecret: this.clientSecret,
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

  private destroyStripe(): void {
    try { this.paymentElement?.destroy(); } catch {}
    this.paymentElement = null;
    this.stripe         = null;
    this.elements       = null;
    this.mounted        = false;
    this.stripeReady    = false;
  }

  // ── Confirm Payment ──────────────────────────────────────────

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.elements || this.stripeLoading) return;

    this.stripeLoading = true;
    this.errorMessage  = '';
    this.errorType     = null;

    // Step 1: Validate fields
    const { error: submitError } = await this.elements.submit();
    if (submitError) {
      this.ngZone.run(() => {
        this.stripeLoading = false;
        this.errorType     = 'validation';
        this.errorMessage  = submitError.message || 'Please check your card details.';
        this.cdr.detectChanges();
      });
      return;
    }

    // Step 2: Confirm payment
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
        this.errorType    = this.getErrorType(error);
        this.errorMessage = this.getErrorMessage(error);
        this.paymentFailed.emit(this.errorMessage);
        this.cdr.detectChanges();
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        this.paymentSuccess.emit(paymentIntent.id);
        return;
      }

      if (paymentIntent?.status === 'requires_payment_method' ||
          paymentIntent?.status === 'requires_action') {
        this.errorType    = 'declined';
        this.errorMessage = 'Payment could not be completed. Please try a different card.';
        this.paymentFailed.emit(this.errorMessage);
        this.cdr.detectChanges();
        return;
      }

      // Unexpected
      this.errorType    = 'generic';
      this.errorMessage = 'Something went wrong. Please try again.';
      this.paymentFailed.emit(this.errorMessage);
      this.cdr.detectChanges();
    });
  }

  // ── Error Helpers ────────────────────────────────────────────

  private getErrorType(error: any): ErrorType {
    if (error.type === 'card_error') {
      const declineCodes = ['card_declined', 'insufficient_funds', 'lost_card', 'stolen_card', 'expired_card'];
      if (declineCodes.includes(error.code)) return 'declined';
      return 'validation';
    }
    if (error.type === 'validation_error') return 'validation';
    return 'generic';
  }

  private getErrorMessage(error: any): string {
    // Specific decline reasons
    switch (error.code) {
      case 'card_declined':
        switch (error.decline_code) {
          case 'insufficient_funds':  return 'Your card has insufficient funds.';
          case 'lost_card':
          case 'stolen_card':         return 'This card cannot be used. Please use a different card.';
          case 'generic_decline':
          default:                    return 'Your card was declined. Please try a different card.';
        }
      case 'expired_card':            return 'Your card has expired. Please use a different card.';
      case 'incorrect_cvc':           return 'Incorrect CVV. Please check and try again.';
      case 'incorrect_number':        return 'Your card number is incorrect.';
      case 'do_not_honor':            return 'Your card was declined. Please contact your bank or try another card.';
      default:
        return error.message || 'Payment failed. Please try again.';
    }
  }

  onGoBack(): void {
    this.destroyStripe();
    this.goBack.emit();
  }
}