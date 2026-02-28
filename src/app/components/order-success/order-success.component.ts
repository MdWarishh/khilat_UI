// src/app/components/order-success/order-success.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.css'
})
export class OrderSuccessComponent implements OnInit {

  // These variables are used in the HTML template
  verifying = true;
  paymentStatus: 'succeeded' | 'failed' | 'processing' = 'failed';
  paymentIntentId = '';
  orderId: string | null = null;
  errorMessage = '';

  // 12 confetti dots for the CSS animation
  confettiDots = Array(12).fill(0);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const paymentIntent  = params['payment_intent'];
      const redirectStatus = params['redirect_status']; // Stripe redirect-based (UPI, netbanking)
      const status         = params['status'];          // Our manual card navigation

      // Case 1: Card payment — we navigated here manually with status=succeeded
      if (status === 'succeeded' && paymentIntent) {
        this.paymentIntentId = paymentIntent;
        this.paymentStatus   = 'succeeded';
        this.verifying       = false;
        this.cartService.clearCart();
        return;
      }

      // Case 2: Stripe redirect (UPI/netbanking) — succeeded
      if (redirectStatus === 'succeeded' && paymentIntent) {
        this.paymentIntentId = paymentIntent;
        this.paymentStatus   = 'succeeded';
        this.verifying       = false;
        this.cartService.clearCart();
        return;
      }

      // Case 3: Stripe redirect — processing (some methods take time)
      if (redirectStatus === 'processing') {
        this.paymentStatus = 'processing';
        this.verifying     = false;
        return;
      }

      // Case 4: Stripe redirect — failed
      if (redirectStatus && redirectStatus !== 'succeeded') {
        this.paymentStatus = 'failed';
        this.errorMessage  = 'Payment was not completed. Please try again.';
        this.verifying     = false;
        return;
      }

      // Case 5: Direct page open — no valid params
      this.paymentStatus = 'failed';
      this.errorMessage  = 'Invalid order session.';
      this.verifying     = false;
    });
  }

  retryCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}