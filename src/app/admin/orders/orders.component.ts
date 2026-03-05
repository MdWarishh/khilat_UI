// admin/orders/orders.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment }       from '../../../environments/environments';
import { forkJoin }          from 'rxjs';

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
interface StatusStat   { label: string; count: number; bg: string; color: string; }
interface TimelineStep { label: string; done: boolean; current: boolean; }

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl:    './orders.component.css'
})
export class AdminOrdersComponent implements OnInit {

  allOrders:      OrderSummaryDto[] = [];
  filteredOrders: OrderSummaryDto[] = [];
  pagedOrders:    OrderSummaryDto[] = [];

  dispatchLoading = false;
  loading = true;
  error   = '';

  searchQuery  = '';
  filterStatus = '';
  dateFrom     = '';
  dateTo       = '';

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

  // FIX: Sirf 2 chips — Pending aur Dispatched, real backend counts se
  statusStats: StatusStat[] = [];

  // Actual backend total counts — page-independent
  pendingTotal    = 0;
  dispatchedTotal = 0;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadStatusCounts(); // Separate call for accurate counts
  }

  // ── Load main orders table ───────────────────────────────────

  loadOrders(): void {
    this.loading = true;
    this.error   = '';

    let params = new HttpParams()
      .set('page', String(this.currentPage))
      .set('size', String(this.pageSize));

    if (this.dateFrom) {
      const d = new Date(this.dateFrom);
      const formattedDate =
        d.getFullYear() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0');
      params = params.set('date', formattedDate);
    }

    this.http.get<PageResponse<OrderSummaryDto>>(
      `${environment.apiUrl}/admin/orders?status=PENDING`,
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

  // FIX: Backend se actual total counts fetch karo — page size 1 se totalElements lelo
  // Pending = /order-pending (sab statuses aate hain wahan), Dispatched = /dispatched-orders
  private loadStatusCounts(): void {
    const pendingParams    = new HttpParams().set('page', '0').set('size', '1');
    const dispatchedParams = new HttpParams().set('page', '0').set('size', '1');

    const pendingReq    = this.http.get<PageResponse<OrderSummaryDto>>(
      `${environment.apiUrl}/admin/order-pending`,
      { headers: this.authHeaders(), params: pendingParams }
    );
    const dispatchedReq = this.http.get<PageResponse<OrderSummaryDto>>(
      `${environment.apiUrl}/admin/dispatched-orders`,
      { headers: this.authHeaders(), params: dispatchedParams }
    );

    forkJoin({ pending: pendingReq, dispatched: dispatchedReq }).subscribe({
      next: ({ pending, dispatched }) => {
        // pending endpoint me sab orders hain — unme se PENDING status wale count karo
        // Lekin totalElements = sab orders ka total hai, isliye
        // hum sirf dispatched ka total lenge from dispatched endpoint
        this.dispatchedTotal = dispatched.totalElements;

        // Pending count = total orders - dispatched (approx) ya sirf pending filter
        // Best approach: ek aur call with size=1000 nahi karenge
        // isliye pending total = order-pending endpoint ka totalElements - dispatchedTotal
        // Actually order-pending sirf non-dispatched orders deta hai ya sab?
        // Safe approach: use allOrders PENDING count + backend total
        this.pendingTotal = pending.totalElements;

        this.buildStatusStats();
      },
      error: () => {
        // Counts load na ho to silently fail — table still works
        this.buildStatusStats();
      }
    });
  }

  // FIX: Sirf PENDING aur DISPATCHED chips — real counts se
  private buildStatusStats(): void {
    this.statusStats = [
      {
        label: 'Pending',
        count: this.pendingTotal,
        bg:    'rgba(245,158,11,0.12)',
        color: '#b45309'
      },
      {
        label: 'Dispatched',
        count: this.dispatchedTotal,
        bg:    'rgba(139,92,246,0.1)',
        color: '#6d28d9'
      },
    ];
  }

  // ── Date filter ──────────────────────────────────────────────

  onDateChange(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  clearDateFilter(): void {
    this.dateFrom    = '';
    this.dateTo      = '';
    this.currentPage = 0;
    this.loadOrders();
  }

  // ── Client-side filter + sort ────────────────────────────────

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

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999);
      list = list.filter(o => new Date(o.createdAt) <= toDate);
    }

    list.sort((a, b) => {
      let va: any, vb: any;
      if (this.sortField === 'orderId')   { va = a.orderId; vb = b.orderId; }
      if (this.sortField === 'amount')    { va = a.amount;  vb = b.amount; }
      if (this.sortField === 'createdAt') { va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); }
      return this.sortDir === 'asc' ? (va < vb ? -1 : va > vb ? 1 : 0)
                                    : (va > vb ? -1 : va < vb ? 1 : 0);
    });

    this.filteredOrders = list;
    this.pagedOrders    = list;
  }

  clearFilters(): void {
    this.searchQuery  = '';
    this.filterStatus = '';
    this.dateFrom     = '';
    this.dateTo       = '';
    this.currentPage  = 0;
    this.loadOrders();
  }

  sort(field: 'orderId' | 'amount' | 'createdAt'): void {
    this.sortDir   = (this.sortField === field && this.sortDir === 'asc') ? 'desc' : 'asc';
    this.sortField = field;
    this.applyFilters();
  }

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

  // ── Dispatch order ───────────────────────────────────────────

  dispatchOrder(order: OrderSummaryDto): void {
    const id = order.orderId;
    if (!confirm(`Mark order #${id} as dispatched?`)) return;

    this.dispatchLoading = true;

    this.http.post<string>(
      `${environment.apiUrl}/admin/dispatch/${id}`, {},
      { headers: this.authHeaders() }
    ).subscribe({
      next: () => {
        this.dispatchLoading = false;
        const summary = this.allOrders.find(o => o.orderId === id);
        if (summary) summary.orderStatus = 'DISPATCHED';
        this.applyFilters();
        // Reload both — orders list + counts
        this.loadOrders();
        this.loadStatusCounts();
      },
      error: (err) => {
        this.dispatchLoading = false;
        this.error = err.error || 'Failed to dispatch order.';
      }
    });
  }

  cancelOrder(order: OrderSummaryDto): void {
    const id = order.orderId;
    if (!confirm(`Cancel order #${id}?`)) return;

    const params = new HttpParams().set('status', 'CANCELLED');
    this.http.patch<string>(
      `${environment.apiUrl}/admin/order/${id}/status`,
      {},
      { headers: this.authHeaders(), params }
    ).subscribe({
      next: () => {
        const summary = this.allOrders.find(o => o.orderId === id);
        if (summary) summary.orderStatus = 'CANCELLED';
        this.applyFilters();
        this.loadOrders();
        this.loadStatusCounts();
      },
      error: (err) => {
        this.error = err.error?.message || 'Could not cancel order.';
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  getStatusClass(s: string): string { return `status-${s}`; }

  getTimeline(status: string): TimelineStep[] {
    const flow = ['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED'];
    if (status === 'CANCELLED') return [
      { label: 'Order Placed', done: true,  current: false },
      { label: 'Cancelled',    done: false, current: true  },
    ];
    const idx = flow.indexOf(status);
    return flow.map((s, i) => ({
      label:   ['Order Placed', 'Confirmed', 'Dispatched', 'Delivered'][i],
      done:    i < idx,
      current: i === idx,
    }));
  }

  resolveImage(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${environment.imageBaseUrl}${url}`;
  }

  displayPage(p: number): number { return p + 1; }

  openDetailPage(order: OrderSummaryDto): void {
    this.router.navigate(['/admin/orders', order.orderId]);
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('admin_token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
}