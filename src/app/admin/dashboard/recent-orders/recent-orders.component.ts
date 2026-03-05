// src/app/admin/dashboard/recent-orders/recent-orders.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { RouterLink }       from '@angular/router';
import { OrderSummaryDto }  from '../dashboard.component';

@Component({
  selector:    'app-dash-recent-orders',
  standalone:  true,
  imports:     [CommonModule, RouterLink],
  templateUrl: './recent-orders.component.html',
  styleUrl:    './recent-orders.component.css',
})
export class DashRecentOrdersComponent {
  @Input() orders: OrderSummaryDto[] = [];

  getStatusClass(s: string): string { return `status-${s}`; }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
}