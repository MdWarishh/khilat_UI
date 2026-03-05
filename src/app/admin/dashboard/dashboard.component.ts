// src/app/admin/dashboard/dashboard.component.ts
import { Component, OnInit }    from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterLink }           from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { forkJoin }             from 'rxjs';
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

  greeting = this.getGreeting();

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadAll(); }

  private loadAll(): void {
    this.loading = true;

    // Fetch orders (large page to compute stats), dispatched count, products, categories
    const ordersReq     = this.http.get<PageResponse<OrderSummaryDto>>(
      `${environment.apiUrl}/admin/order-pending`,
      { headers: this.authHeaders(), params: new HttpParams().set('page', '0').set('size', '100') }
    );
    const dispatchedReq = this.http.get<PageResponse<OrderSummaryDto>>(
      `${environment.apiUrl}/admin/dispatched-orders`,
      { headers: this.authHeaders(), params: new HttpParams().set('page', '0').set('size', '1') }
    );
    const productsReq   = this.http.get<PageResponse<any>>(
      `${environment.apiUrl}/admin/getallproducts`,
      { headers: this.authHeaders(), params: new HttpParams().set('page', '0').set('size', '1') }
    );
    const catsReq       = this.http.get<any[]>(
      `${environment.apiUrl}/categories/getAllCategories`
    );

    forkJoin({ orders: ordersReq, dispatched: dispatchedReq, products: productsReq, cats: catsReq })
      .subscribe({
        next: ({ orders, dispatched, products, cats }) => {

          const pendingCount = orders.content.filter(o => o.orderStatus === 'PENDING').length;
          const revenue      = orders.content.reduce((s, o) => s + (o.amount || 0), 0);

          this.stats = {
            totalOrders:      orders.totalElements,
            pendingOrders:    pendingCount,
            dispatchedOrders: dispatched.totalElements,
            totalProducts:    products.totalElements,
            totalCategories:  cats.length,
            totalRevenue:     revenue,
          };

          this.recentOrders      = orders.content.slice(0, 5);
          this.allOrdersForChart = orders.content;
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
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
}