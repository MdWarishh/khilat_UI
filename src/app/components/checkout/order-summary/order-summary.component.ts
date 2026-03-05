// src/app/components/checkout/order-summary/order-summary.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { CartItem }         from '../../../services/cart.service';

@Component({
  selector:    'app-order-summary',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './order-summary.component.html',
  styleUrl:    './order-summary.component.css',
})
export class OrderSummaryComponent {
  @Input() cartItems: CartItem[] = [];
  @Input() subtotal   = 0;
  @Input() shipping   = 0;
  @Input() total      = 0;

  getItemTotal(item: CartItem): string {
    return (item.currentPrice * item.quantity).toFixed(2);
  }
}