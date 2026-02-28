// offer-strip.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-offer-strip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offer-strip.component.html',
  styleUrl: './offer-strip.component.css',
})
export class OfferStripComponent {
  readonly offerItems = [
    'Free Shipping above ₹999',
    'Easy 7-day Returns',
    'Authentic Handcrafted Designs',
    'New Arrivals Every Week',
    'COD Available',
    'Secure Payments',
  ];
}