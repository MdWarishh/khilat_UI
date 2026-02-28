// src/app/components/order-success/order-success.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.css'
})
export class OrderSuccessComponent implements OnInit {

  status: 'loading' | 'success' | 'failed' = 'loading';
  paymentIntentId = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const paymentIntent       = params['payment_intent'];
      const paymentIntentStatus = params['payment_intent_client_secret'];
      const redirectStatus      = params['redirect_status'];  // Stripe adds this on redirect
      const status              = params['status'];           // Our manual navigation adds this

      // Case 1: We navigated here manually after card success
      if (status === 'succeeded' && paymentIntent) {
        this.paymentIntentId = paymentIntent;
        this.status = 'success';
        this.cartService.clearCart();
        return;
      }

      // Case 2: Stripe redirected here (UPI, netbanking, etc.)
      if (redirectStatus === 'succeeded' && paymentIntent) {
        this.paymentIntentId = paymentIntent;
        this.status = 'success';
        this.cartService.clearCart();
        return;
      }

      // Case 3: Stripe redirected but payment failed
      if (redirectStatus && redirectStatus !== 'succeeded') {
        this.status = 'failed';
        this.errorMessage = 'Payment was not completed. Please try again.';
        return;
      }

      // Case 4: No valid params — someone opened this page directly
      this.status = 'failed';
      this.errorMessage = 'Invalid order session.';
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  retryPayment(): void {
    this.router.navigate(['/checkout']);
  }
}