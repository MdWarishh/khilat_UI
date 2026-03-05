// src/app/admin/dashboard/orders-chart/orders-chart.component.ts
import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule }                from '@angular/common';
import { OrderSummaryDto }             from '../dashboard.component';

interface DayBar {
  label:   string;   // e.g. "Mon"
  date:    string;   // e.g. "04 Mar"
  count:   number;
  revenue: number;
  pct:     number;   // percent of max (for bar height)
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

  bars:     DayBar[] = [];
  maxCount = 0;
  totalRevenue = 0;
  totalOrders  = 0;

  ngOnChanges(): void { this.buildChart(); }

  private buildChart(): void {
    // Build last 7 days
    const days: DayBar[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({
        label:   d.toLocaleDateString('en-IN', { weekday: 'short' }),
        date:    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        count:   0,
        revenue: 0,
        pct:     0,
      });
    }

    // Aggregate orders by day
    this.orders.forEach(o => {
      const oDate = new Date(o.createdAt);
      const dayIdx = days.findIndex(d => {
        const ref = new Date(now);
        ref.setDate(ref.getDate() - (6 - days.indexOf(days.find(dd => dd.date === d.date)!)));
        return oDate.toDateString() === ref.toDateString();
      });

      // Simpler: match by date string
      const oDateStr = oDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const match = days.find(d => d.date === oDateStr);
      if (match) {
        match.count++;
        match.revenue += o.amount || 0;
      }
    });

    this.maxCount = Math.max(...days.map(d => d.count), 1);

    days.forEach(d => {
      d.pct = (d.count / this.maxCount) * 100;
    });

    this.bars        = days;
    this.totalOrders = days.reduce((s, d) => s + d.count, 0);
    this.totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
  }
}