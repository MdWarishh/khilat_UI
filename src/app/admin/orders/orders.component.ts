// admin/orders/orders.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router }            from '@angular/router';
import { environment }       from '../../../environments/environments';

export interface OrderSummaryDto {
  orderId:       number;
  name:          string;
  phone:         number | null;
  amount:        number;
  paymentStatus: string;
  orderStatus:   string;
  createdAt:     string;
}

interface PageResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
}

interface StatusOption { value: string; label: string; }

@Component({
  selector:     'app-admin-orders',
  standalone:   true,
  imports:      [CommonModule, FormsModule],
  templateUrl:  './orders.component.html',
  styleUrl:     './orders.component.css'
})
export class AdminOrdersComponent implements OnInit {

  allOrders:      OrderSummaryDto[] = [];
  filteredOrders: OrderSummaryDto[] = [];
  pagedOrders:    OrderSummaryDto[] = [];

  loading         = true;
  error           = '';
  dispatchedCount = 0;

  searchQuery  = '';
  filterStatus = '';
  dateFrom     = '';

  sortField: 'orderId' | 'amount' | 'createdAt' = 'createdAt';
  sortDir:   'asc' | 'desc'                      = 'desc';

  currentPage   = 0;
  pageSize      = 10;
  totalPages    = 1;
  totalElements = 0;
  startIndex    = 0;
  endIndex      = 0;
  pageNumbers:  number[] = [];

  allStatuses: StatusOption[] = [
    { value: 'PENDING',    label: 'Pending'    },
    { value: 'CONFIRMED',  label: 'Confirmed'  },
    { value: 'DISPATCHED', label: 'Dispatched' },
    { value: 'DELIVERED',  label: 'Delivered'  },
    { value: 'CANCELLED',  label: 'Cancelled'  },
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadDispatchedCount();
  }

  // ── Main orders list ─────────────────────────────────────────

  loadOrders(): void {
    this.loading = true;
    this.error   = '';

    let params = new HttpParams()
      .set('status', 'PENDING')
      .set('page', String(this.currentPage))
      .set('size', String(this.pageSize));

    if (this.dateFrom) {
      const d = new Date(this.dateFrom);
      const formatted = d.getFullYear()
        + String(d.getMonth() + 1).padStart(2, '0')
        + String(d.getDate()).padStart(2, '0');
      params = params.set('date', formatted);
    }

    this.http.get<PageResponse<OrderSummaryDto>>(
      `${environment.apiUrl}/admin/orders`,
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
        this.error   = err.error?.message || 'Failed to load orders.';
        this.loading = false;
      }
    });
  }

  // ── Dispatched count — size=1, sirf totalElements chahiye ───

  private loadDispatchedCount(): void {
    const params = new HttpParams()
      .set('status', 'DISPATCHED')
      .set('page', '0')
      .set('size', '1');

    this.http.get<PageResponse<OrderSummaryDto>>(
      `${environment.apiUrl}/admin/orders`,
      { headers: this.authHeaders(), params }
    ).subscribe({
      next:  (res) => { this.dispatchedCount = res.totalElements; },
      error: ()    => { this.dispatchedCount = 0; }   // silently fail
    });
  }

  // ── Filters & Sort ───────────────────────────────────────────

  applyFilters(): void {
    let list = [...this.allOrders];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(o =>
        String(o.orderId).includes(q) ||
        o.name?.toLowerCase().includes(q) ||
        String(o.phone || '').includes(q)
      );
    }

    if (this.filterStatus) {
      list = list.filter(o => o.orderStatus === this.filterStatus);
    }

    list.sort((a, b) => {
      let va: any, vb: any;
      if (this.sortField === 'orderId')   { va = a.orderId; vb = b.orderId; }
      if (this.sortField === 'amount')    { va = a.amount;  vb = b.amount; }
      if (this.sortField === 'createdAt') { va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); }
      return this.sortDir === 'asc'
        ? (va < vb ? -1 : va > vb ? 1 : 0)
        : (va > vb ? -1 : va < vb ? 1 : 0);
    });

    this.filteredOrders = list;
    this.pagedOrders    = list;
  }

  clearFilters(): void {
    this.searchQuery  = '';
    this.filterStatus = '';
    this.dateFrom     = '';
    this.currentPage  = 0;
    this.loadOrders();
  }

  sort(field: 'orderId' | 'amount' | 'createdAt'): void {
    this.sortDir   = this.sortField === field && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortField = field;
    this.applyFilters();
  }

  // ── Date ─────────────────────────────────────────────────────

  onDateChange():    void { this.currentPage = 0; this.loadOrders(); }
  clearDateFilter(): void { this.dateFrom = ''; this.currentPage = 0; this.loadOrders(); }

  // ── Pagination ───────────────────────────────────────────────

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.loadOrders();
  }

  onPageSizeChange(): void { this.currentPage = 0; this.loadOrders(); }

  private buildPageNumbers(): void {
    const total = this.totalPages, cur = this.currentPage;
    const pages: number[] = [];
    if (total <= 7) {
      for (let i = 0; i < total; i++) pages.push(i);
    } else {
      pages.push(0);
      if (cur > 2) pages.push(-1);
      for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) pages.push(i);
      if (cur < total - 3) pages.push(-1);
      pages.push(total - 1);
    }
    this.pageNumbers = pages;
  }

  // ── Actions ──────────────────────────────────────────────────

  dispatchOrder(order: OrderSummaryDto): void {
    if (!confirm(`Mark order #${order.orderId} as dispatched?`)) return;

    this.http.post<string>(
      `${environment.apiUrl}/admin/dispatch/${order.orderId}`, {},
      { headers: this.authHeaders() }
    ).subscribe({
      next: () => {
        order.orderStatus = 'DISPATCHED';
        this.dispatchedCount++;        // chip instantly update
        this.applyFilters();
      },
      error: (err) => { this.error = err.error || 'Failed to dispatch order.'; }
    });
  }

  cancelOrder(order: OrderSummaryDto): void {
    if (!confirm(`Cancel order #${order.orderId}?`)) return;

    const params = new HttpParams().set('status', 'CANCELLED');
    this.http.patch<string>(
      `${environment.apiUrl}/admin/order/${order.orderId}/status`,
      {},
      { headers: this.authHeaders(), params }
    ).subscribe({
      next: () => {
        order.orderStatus = 'CANCELLED';
        this.applyFilters();
      },
      error: (err) => { this.error = err.error?.message || 'Could not cancel order.'; }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  getStatusClass(s: string): string { return `status-${s}`; }
  displayPage(p: number):    number  { return p + 1; }

  openDetailPage(order: OrderSummaryDto): void {
    this.router.navigate(['/admin/orders', order.orderId]);
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('admin_token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}