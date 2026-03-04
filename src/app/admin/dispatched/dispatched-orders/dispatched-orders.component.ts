// src/app/admin/dispatched/dispatched-orders/dispatched-orders.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router }            from '@angular/router';
import { environment }       from '../../../../environments/environments';

export interface OrderSummaryDto {
  orderId:       number;
  name:          string;
  phone:         number | null;
  amount:        number;
  paymentStatus: string;
  orderStatus:   string;
  createdAt:     string;
  email:         string;
}

interface PageResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
}

@Component({
  selector: 'app-dispatched-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dispatched-orders.component.html',
  styleUrl:    './dispatched-orders.component.css'
})
export class DispatchedOrdersComponent implements OnInit {

  allOrders:      OrderSummaryDto[] = [];
  pagedOrders:    OrderSummaryDto[] = [];

  loading = true;
  error   = '';

  searchQuery = '';

  sortField: 'orderId' | 'amount' | 'createdAt' = 'createdAt';
  sortDir:   'asc' | 'desc'                      = 'desc';

  currentPage   = 0;
  pageSize      = 10;
  totalPages    = 1;
  totalElements = 0;
  startIndex    = 0;
  endIndex      = 0;
  pageNumbers:  number[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.loading = true;
    this.error   = '';

    const params = new HttpParams()
      .set('page', String(this.currentPage))
      .set('size', String(this.pageSize));

    this.http.get<PageResponse<OrderSummaryDto>>(
      `${environment.apiUrl}/admin/dispatched-orders`,
      { headers: this.authHeaders(), params }
    ).subscribe({
      next: (res) => {
        this.allOrders     = res.content;
        this.totalElements = res.totalElements;
        this.totalPages    = res.totalPages;
        this.startIndex    = this.currentPage * this.pageSize;
        this.endIndex      = this.startIndex + res.content.length;
        this.applyFilters();
        this.buildPageNumbers();
        this.loading = false;
      },
      error: (err) => {
        this.error   = err.error?.message || 'Failed to load dispatched orders.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let list = [...this.allOrders];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(o =>
        String(o.orderId).includes(q) ||
        o.name?.toLowerCase().includes(q) ||
        String(o.phone || '').includes(q) ||
        o.email?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let va: any, vb: any;
      if (this.sortField === 'orderId')   { va = a.orderId; vb = b.orderId; }
      if (this.sortField === 'amount')    { va = a.amount;  vb = b.amount; }
      if (this.sortField === 'createdAt') { va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); }
      return this.sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0)
                                    : (va > vb ? -1 : va < vb ? 1 : 0);
    });

    this.pagedOrders = list;
  }

  sort(field: 'orderId' | 'amount' | 'createdAt'): void {
    this.sortDir   = (this.sortField === field && this.sortDir === 'asc') ? 'desc' : 'asc';
    this.sortField = field;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadOrders();
  }

  onPageSizeChange(): void { this.currentPage = 0; this.loadOrders(); }

  private buildPageNumbers(): void {
    const total = this.totalPages, cur = this.currentPage;
    const pages: number[] = [];
    if (total <= 7) { for (let i = 0; i < total; i++) pages.push(i); }
    else {
      pages.push(0);
      if (cur > 2) pages.push(-1);
      for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) pages.push(i);
      if (cur < total - 3) pages.push(-1);
      pages.push(total - 1);
    }
    this.pageNumbers = pages;
  }

  openDetail(order: OrderSummaryDto): void {
    this.router.navigate(['/admin/dispatched', order.orderId]);
  }

  displayPage(p: number): number { return p + 1; }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('admin_token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
}