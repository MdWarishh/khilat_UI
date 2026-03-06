// src/app/admin/dashboard/orders-chart/orders-chart.component.ts
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule }                from '@angular/common';
import { OrderSummaryDto }             from '../dashboard.component';

interface DayBar {
  label:   string;  // e.g. "Mon"
  date:    string;  // e.g. "04 Mar"
  count:   number;
  revenue: number;
  pct:     number;  // percent of max (for bar height)
}

@Component({
  selector:    'app-dash-orders-chart',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './orders-chart.component.html',
  styleUrl:    './orders-chart.component.css',
})
export class DashOrdersChartComponent implements OnChanges {
  @Input() orders: OrderSummaryDto[] = [];

  bars:         DayBar[] = [];
  maxCount      = 0;
  totalRevenue  = 0;
  totalOrders   = 0;

  ngOnChanges(): void { this.buildChart(); }

  private buildChart(): void {
    const now  = new Date();
    const days: DayBar[] = [];

    // Build last 7 days with normalized date keys
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        label:   d.toLocaleDateString('en-IN', { weekday: 'short' }),
        date:    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        count:   0,
        revenue: 0,
        pct:     0,
        // store timestamp for matching
        ...(({ _ts: d.getTime() }) as any),
      });
    }

    // Map each day to its date string for O(1) lookup
    const dateKeyMap = new Map<string, DayBar>();
    days.forEach(day => dateKeyMap.set(day.date, day));

    // Aggregate orders into matching day bucket
    this.orders.forEach(o => {
      const oDate    = new Date(o.createdAt);
      const oDateStr = oDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const bucket   = dateKeyMap.get(oDateStr);
      if (bucket) {
        bucket.count++;
        bucket.revenue += o.amount || 0;
      }
    });

    this.maxCount = Math.max(...days.map(d => d.count), 1);
    days.forEach(d => { d.pct = (d.count / this.maxCount) * 100; });

    this.bars         = days;
    this.totalOrders  = days.reduce((s, d) => s + d.count, 0);
    this.totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
  }
}