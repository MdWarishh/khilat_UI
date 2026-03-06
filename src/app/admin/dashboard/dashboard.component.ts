// src/app/admin/dashboard/dashboard.component.ts
import { Component, OnInit }    from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterLink }           from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { forkJoin, of }         from 'rxjs';
import { catchError }           from 'rxjs/operators';
import { environment }          from '../../../environments/environments';

import { DashStatsCardsComponent }   from './stats-cards/stats-cards.component';
import { DashRecentOrdersComponent } from './recent-orders/recent-orders.component';
import { DashOrdersChartComponent }  from './orders-chart/orders-chart.component';

export interface OrderSummaryDto {
  orderId:       number;
  name:          string;
  phone:         number | null;
  amount:        number;
  paymentStatus: string;
  orderStatus:   string;
  createdAt:     string;
}

export interface PageResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
}

export interface DashboardStats {
  totalOrders:      number;
  pendingOrders:    number;
  dispatchedOrders: number;
  totalProducts:    number;
  totalCategories:  number;
  totalRevenue:     number;
}

@Component({
  selector:    'app-dashboard',
  standalone:  true,
  imports: [
    CommonModule,
    RouterLink,
    DashStatsCardsComponent,
    DashRecentOrdersComponent,
    DashOrdersChartComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.css',
})
export class DashboardComponent implements OnInit {

  loading = true;
  error   = '';

  stats: DashboardStats = {
    totalOrders:      0,
    pendingOrders:    0,
    dispatchedOrders: 0,
    totalProducts:    0,
    totalCategories:  0,
    totalRevenue:     0,
  };

  recentOrders:      OrderSummaryDto[] = [];
  allOrdersForChart: OrderSummaryDto[] = [];

  adminEmail = localStorage.getItem('admin_email') || 'admin';
  adminName  = this.adminEmail.split('@')[0];
  greeting   = this.getGreeting();

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadAll(); }

  private loadAll(): void {
    this.loading = true;
    this.error   = '';

    const h = this.authHeaders();
    const op = (status: string, page: number, size: number) =>
      new HttpParams().set('status', status).set('page', String(page)).set('size', String(size));

    // 3 parallel calls — status param always present (API requires it)
    forkJoin({
      // PENDING: size=50 → recent list (slice 5) + chart data + revenue
      pending:    this.http.get<PageResponse<OrderSummaryDto>>(
                    `${environment.apiUrl}/admin/orders`,
                    { headers: h, params: op('PENDING', 0, 50) }),

      // DISPATCHED: size=1 → only need totalElements
      dispatched: this.http.get<PageResponse<OrderSummaryDto>>(
                    `${environment.apiUrl}/admin/orders`,
                    { headers: h, params: op('DISPATCHED', 0, 1) }),

      // Products: size=1 → only need totalElements
      products:   this.http.get<PageResponse<any>>(
                    `${environment.apiUrl}/product/getallproducts`,
                    { params: new HttpParams().set('page', '0').set('size', '1') }),

      // Categories — with fallback so one failure doesn't kill dashboard
      cats:       this.http.get<any[]>(
                    `${environment.apiUrl}/categories/getAllCategories`)
                    .pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ pending, dispatched, products, cats }) => {
        const revenue = pending.content.reduce((s, o) => s + (o.amount || 0), 0);

        this.stats = {
          totalOrders:      pending.totalElements,
          pendingOrders:    pending.totalElements,
          dispatchedOrders: dispatched.totalElements,
          totalProducts:    products.totalElements,
          totalCategories:  Array.isArray(cats) ? cats.length : 0,
          totalRevenue:     revenue,
        };

        this.recentOrders      = pending.content.slice(0, 5);
        this.allOrdersForChart = pending.content;
        this.loading           = false;
      },
      error: () => {
        this.error   = 'Could not load dashboard data.';
        this.loading = false;
      }
    });
  }

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('admin_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}