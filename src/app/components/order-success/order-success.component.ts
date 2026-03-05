// src/app/components/order-success/order-success.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartService }       from '../../services/cart.service';

@Component({
  selector:    'app-order-success',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './order-success.component.html',
  styleUrl:    './order-success.component.css',
})
export class OrderSuccessComponent implements OnInit {

  verifying     = true;
  paymentStatus: 'succeeded' | 'failed' | 'processing' = 'failed';
  paymentIntentId = '';
  orderId: string | null = null;
  errorMessage  = '';
  confettiDots  = Array(12).fill(0);

  constructor(
    private route:       ActivatedRoute,
    private router:      Router,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const paymentIntent  = params['payment_intent']  || '';
      const redirectStatus = params['redirect_status'] || ''; // Stripe redirect (UPI/netbanking)
      const status         = params['status']          || ''; // Our card flow manual nav

      // ── Case 1: Card payment — navigated manually with status=succeeded ──
      if (status === 'succeeded' && paymentIntent) {
        this.paymentIntentId = paymentIntent;
        this.paymentStatus   = 'succeeded';
        this.verifying       = false;
        this.cartService.clearCart().subscribe();
        return;
      }

      // ── Case 2: Stripe redirect — succeeded (UPI, netbanking, etc.) ──
      if (redirectStatus === 'succeeded' && paymentIntent) {
        this.paymentIntentId = paymentIntent;
        this.paymentStatus   = 'succeeded';
        this.verifying       = false;
        this.cartService.clearCart().subscribe();
        return;
      }

      // ── Case 3: Stripe redirect — processing ──
      if (redirectStatus === 'processing') {
        this.paymentStatus = 'processing';
        this.verifying     = false;
        return;
      }

      // ── Case 4: Stripe redirect — failed/canceled ──
      if (redirectStatus && redirectStatus !== 'succeeded' && redirectStatus !== 'processing') {
        this.paymentStatus = 'failed';
        this.errorMessage  = 'Payment was not completed. No amount was charged.';
        this.verifying     = false;
        return;
      }

      // ── Case 5: No valid params — direct URL access or unknown state ──
      this.paymentStatus = 'failed';
      this.errorMessage  = 'No payment information found.';
      this.verifying     = false;
    });
  }

  retryCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}