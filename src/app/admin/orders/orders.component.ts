// admin/orders/orders.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
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

export interface OrderItemDto {
  productId:   number;
  productName: string;
  price:       number;
  quantity:    number;
  imageUrl?:   string;
}

export interface OrderDto {
  id:             number;
  guestId:        string;
  customerName:   string;
  customerEmail:  string;
  customerPhone:  string;
  address:        string;
  totalAmount:    number;
  shippingCharge: number;
  status:         string;
  paymentMethod?: string;
  createdAt:      string;
  orderItems:     OrderItemDto[];
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

  showDetails    = false;
  selectedOrder: OrderDto | null = null;
  detailLoading  = false;
  detailError    = '';
  dispatchLoading = false;

  loading = true;
  error   = '';

  // Filters
  searchQuery  = '';
  filterStatus = '';
  // Date range — stored as 'YYYY-MM-DD' strings (HTML date input format)
  dateFrom = '';
  dateTo   = '';

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

  statusStats: StatusStat[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void { this.loadOrders(); }

  // ─────────────────────────────────────────────
  // LOAD ORDERS — date param sent to backend
  // Backend accepts: GET /api/admin/order-pending?page=0&size=10&date=2025-03-01
  // For date range we send dateFrom as `date` param and filter dateTo client-side
  // ─────────────────────────────────────────────

  loadOrders(): void {
    this.loading = true;
    this.error   = '';

    let params = new HttpParams()
      .set('page', String(this.currentPage))
      .set('size', String(this.pageSize));

    // Send dateFrom to backend (it filters from that date onwards)
    if (this.dateFrom) {
      params = params.set('date', this.dateFrom);
    }

    const auth = this.authHeaders();
    this.http.get<PageResponse<OrderSummaryDto>>(
      `${environment.apiUrl}/admin/order-pending`,
      { headers: auth.headers, params }
    ).subscribe({
      next: (res) => {
        this.allOrders     = res.content;
        this.totalElements = res.totalElements;
        this.totalPages    = res.totalPages;
        this.startIndex    = this.currentPage * this.pageSize;
        this.endIndex      = this.startIndex + res.content.length;

        this.applyFilters();
        this.buildStatusStats();
        this.buildPageNumbers();
        this.loading = false;
      },
      error: (err) => {
        this.error   = err.error?.message || 'Failed to load orders.';
        this.loading = false;
      }
    });
  }

  // ─────────────────────────────────────────────
  // DATE RANGE FILTER HANDLERS
  // ─────────────────────────────────────────────

  onDateChange(): void {
    this.currentPage = 0;
    this.loadOrders();
  }

  clearDateFilter(): void {
    this.dateFrom = '';
    this.dateTo   = '';
    this.currentPage = 0;
    this.loadOrders();
  }

  // ─────────────────────────────────────────────
  // LOAD ORDER DETAIL
  // ─────────────────────────────────────────────

  openDetails(order: OrderSummaryDto): void {
    this.showDetails   = true;
    this.detailLoading = true;
    this.detailError   = '';
    this.selectedOrder = null;

    this.http.get<OrderDto>(
      `${environment.apiUrl}/admin/order/${order.orderId}`,
      this.authHeaders()
    ).subscribe({
      next: (res) => {
        this.selectedOrder = res;
        this.detailLoading = false;
      },
      error: (err) => {
        this.detailError   = err.error?.message || 'Failed to load order details.';
        this.detailLoading = false;
      }
    });
  }

  // ─────────────────────────────────────────────
  // CLIENT-SIDE FILTER + SORT
  // dateTo is applied client-side (backend only supports single date)
  // ─────────────────────────────────────────────

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

    // Client-side dateTo filter (upper bound)
    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999); // include full day
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

  // ─────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────

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

  // ─────────────────────────────────────────────
  // DISPATCH ORDER
  // POST /api/admin/dispatch/{orderId}
  // Updates status in list + modal immediately
  // ─────────────────────────────────────────────

  dispatchOrder(order: OrderSummaryDto | OrderDto): void {
    const id = 'orderId' in order ? order.orderId : order.id;
    if (!confirm(`Mark order #${id} as dispatched?`)) return;

    this.dispatchLoading = true;

    this.http.post<string>(
      `${environment.apiUrl}/admin/dispatch/${id}`, {},
      this.authHeaders()
    ).subscribe({
      next: () => {
        this.dispatchLoading = false;

        // Update in allOrders list
        const summary = this.allOrders.find(o => o.orderId === id);
        if (summary) summary.orderStatus = 'DISPATCHED';

        // Update in modal if open
        if (this.selectedOrder?.id === id) {
          this.selectedOrder = { ...this.selectedOrder, status: 'DISPATCHED' };
        }

        this.applyFilters();
        this.buildStatusStats();
      },
      error: (err) => {
        this.dispatchLoading = false;
        this.error = err.error || 'Failed to dispatch order.';
      }
    });
  }

  cancelOrder(order: OrderSummaryDto | OrderDto): void {
    const id = 'orderId' in order ? order.orderId : order.id;
    if (!confirm(`Cancel order #${id}?`)) return;

    const summary = this.allOrders.find(o => o.orderId === id);
    if (summary) summary.orderStatus = 'CANCELLED';
    if (this.selectedOrder?.id === id) {
      this.selectedOrder = { ...this.selectedOrder, status: 'CANCELLED' };
    }
    this.applyFilters();
    this.buildStatusStats();
  }

  // ─────────────────────────────────────────────
  // STATUS STATS
  // ─────────────────────────────────────────────

  private buildStatusStats(): void {
    const cfg: Record<string, { bg: string; color: string }> = {
      PENDING:    { bg: 'rgba(245,158,11,0.12)', color: '#b45309' },
      CONFIRMED:  { bg: 'rgba(59,130,246,0.1)',  color: '#1d4ed8' },
      DISPATCHED: { bg: 'rgba(139,92,246,0.1)',  color: '#6d28d9' },
      DELIVERED:  { bg: 'rgba(34,197,94,0.1)',   color: '#15803d' },
      CANCELLED:  { bg: 'rgba(220,38,38,0.1)',   color: '#dc2626' },
    };
    this.statusStats = this.allStatuses.map(s => ({
      label: s.label,
      count: this.allOrders.filter(o => o.orderStatus === s.value).length,
      bg:    cfg[s.value].bg,
      color: cfg[s.value].color,
    }));
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

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

  getSubtotal(order: OrderDto): number {
    return (order.totalAmount || 0) - (order.shippingCharge || 0);
  }

  // Resolve relative image URLs
  resolveImage(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${environment.imageBaseUrl}${url}`;
  }

  displayPage(p: number): number { return p + 1; }

  openDetailPage(order: OrderSummaryDto): void {
    this.router.navigate(['/admin/orders', order.orderId]);
  }

  private authHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('admin_token') || '';
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }
}