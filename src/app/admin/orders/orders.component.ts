// admin/orders/orders.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment }       from '../../../environments/environments';

export interface OrderItem {
  productId: number;
  name:      string;
  price:     number;
  qty:       number;
  image?:    string;
}

export interface Order {
  id:             number;
  guestId:        string;
  customerName:   string;
  customerEmail:  string;
  customerPhone:  string;
  addressLine1:   string;
  addressLine2?:  string;
  city:           string;
  state:          string;
  pincode:        string;
  items:          OrderItem[];
  subtotal:       number;
  shipping:       number;
  total:          number;
  status:         string;
  paymentMethod?: string;
  createdAt:      string;
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

  // ── Data ──────────────────────────────────────
  allOrders:      Order[] = [];
  filteredOrders: Order[] = [];
  pagedOrders:    Order[] = [];

  // ── State ──────────────────────────────────────
  loading     = true;
  error       = '';
  showDetails = false;
  selectedOrder: Order | null = null;

  // ── Filters ────────────────────────────────────
  searchQuery  = '';
  filterStatus = '';
  filterDate   = '';

  // ── Sort ───────────────────────────────────────
  sortField: 'id' | 'total' | 'createdAt' = 'createdAt';
  sortDir:   'asc' | 'desc'               = 'desc';

  // ── Pagination ─────────────────────────────────
  currentPage = 1;
  pageSize    = 10;
  totalPages  = 1;
  startIndex  = 0;
  endIndex    = 0;
  pageNumbers: number[] = [];

  // ── Status config ──────────────────────────────
  allStatuses: StatusOption[] = [
    { value: 'PENDING',   label: 'Pending'   },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'SHIPPED',   label: 'Shipped'   },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  statusStats: StatusStat[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void { this.loadOrders(); }

  // ─────────────────────────────────────────────
  // LOAD
  // ─────────────────────────────────────────────

  loadOrders(): void {
    this.loading = true;
    this.http.get<Order[]>(
      `${environment.apiUrl}/admin/orders`,
      { headers: this.authHeaders() }
    ).subscribe({
      next: (res) => {
        this.allOrders = res;
        this.applyFilters();
        this.buildStatusStats();
        this.loading = false;
      },
      error: (err) => {
        this.error   = err.error?.message || 'Failed to load orders.';
        this.loading = false;
      }
    });
  }

  // ─────────────────────────────────────────────
  // FILTERS + SORT + PAGINATION
  // ─────────────────────────────────────────────

  applyFilters(): void {
    let list = [...this.allOrders];

    // Search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(o =>
        String(o.id).includes(q)                   ||
        o.customerName?.toLowerCase().includes(q)  ||
        o.customerEmail?.toLowerCase().includes(q) ||
        o.guestId?.toLowerCase().includes(q)       ||
        o.city?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (this.filterStatus) {
      list = list.filter(o => o.status === this.filterStatus);
    }

    // Date filter
    if (this.filterDate) {
      const now   = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      list = list.filter(o => {
        const d = new Date(o.createdAt);
        if (this.filterDate === 'today') {
          return d >= today;
        }
        if (this.filterDate === 'week') {
          const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
          return d >= weekAgo;
        }
        if (this.filterDate === 'month') {
          const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1);
          return d >= monthAgo;
        }
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      let va: any, vb: any;
      if (this.sortField === 'id')        { va = a.id;        vb = b.id; }
      if (this.sortField === 'total')     { va = a.total;     vb = b.total; }
      if (this.sortField === 'createdAt') { va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); }
      if (va < vb) return this.sortDir === 'asc' ? -1 : 1;
      if (va > vb) return this.sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    this.filteredOrders = list;
    this.currentPage = 1;
    this.updatePagination();
    this.buildStatusStats();
  }

  clearFilters(): void {
    this.searchQuery  = '';
    this.filterStatus = '';
    this.filterDate   = '';
    this.applyFilters();
  }

  sort(field: 'id' | 'total' | 'createdAt'): void {
    this.sortDir   = (this.sortField === field && this.sortDir === 'asc') ? 'desc' : 'asc';
    this.sortField = field;
    this.applyFilters();
  }

  onPageSizeChange(): void { this.currentPage = 1; this.updatePagination(); }
  goToPage(page: number):  void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  private updatePagination(): void {
    const total     = this.filteredOrders.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    this.startIndex  = (this.currentPage - 1) * this.pageSize;
    this.endIndex    = Math.min(this.startIndex + this.pageSize, total);
    this.pagedOrders = this.filteredOrders.slice(this.startIndex, this.endIndex);
    this.buildPageNumbers();
  }

  private buildPageNumbers(): void {
    const total = this.totalPages, cur = this.currentPage;
    const pages: number[] = [];
    if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
    else {
      pages.push(1);
      if (cur > 3) pages.push(-1);
      for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
      if (cur < total - 2) pages.push(-1);
      pages.push(total);
    }
    this.pageNumbers = pages;
  }

  // ─────────────────────────────────────────────
  // STATUS STATS
  // ─────────────────────────────────────────────

  private buildStatusStats(): void {
    const cfg: Record<string, { bg: string; color: string }> = {
      PENDING:   { bg: 'rgba(245,158,11,0.12)', color: '#b45309' },
      CONFIRMED: { bg: 'rgba(59,130,246,0.1)',  color: '#1d4ed8' },
      SHIPPED:   { bg: 'rgba(139,92,246,0.1)',  color: '#6d28d9' },
      DELIVERED: { bg: 'rgba(34,197,94,0.1)',   color: '#15803d' },
      CANCELLED: { bg: 'rgba(220,38,38,0.1)',   color: '#dc2626' },
    };
    this.statusStats = this.allStatuses.map(s => ({
      label: s.label,
      count: this.allOrders.filter(o => o.status === s.value).length,
      bg:    cfg[s.value].bg,
      color: cfg[s.value].color,
    }));
  }

  // ─────────────────────────────────────────────
  // STATUS UPDATE
  // ─────────────────────────────────────────────

  updateStatus(order: Order): void {
    this.http.put(
      `${environment.apiUrl}/admin/orders/${order.id}/status`,
      { status: order.status },
      { headers: this.authHeaders() }
    ).subscribe({
      next:  () => { this.buildStatusStats(); },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update status.';
        this.loadOrders(); // Revert
      }
    });
  }

  cancelOrder(order: Order): void {
    if (!confirm(`Cancel order #${order.id}? This cannot be undone.`)) return;
    order.status = 'CANCELLED';
    this.updateStatus(order);
    if (this.selectedOrder?.id === order.id) {
      this.selectedOrder.status = 'CANCELLED';
    }
  }

  // ─────────────────────────────────────────────
  // DETAILS MODAL
  // ─────────────────────────────────────────────

  openDetails(order: Order): void {
    this.selectedOrder = { ...order };
    this.showDetails   = true;
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getTimeline(currentStatus: string): TimelineStep[] {
    const flow = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    if (currentStatus === 'CANCELLED') {
      return [
        { label: 'Order Placed',  done: true,  current: false },
        { label: 'Cancelled',     done: false, current: true  },
      ];
    }
    const idx = flow.indexOf(currentStatus);
    return flow.map((s, i) => ({
      label:   ['Order Placed', 'Confirmed', 'Shipped', 'Delivered'][i],
      done:    i < idx,
      current: i === idx,
    }));
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` });
  }
}