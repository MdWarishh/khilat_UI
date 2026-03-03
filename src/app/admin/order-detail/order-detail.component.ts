// order-detail.component.ts
import { Component, OnInit }       from '@angular/core';
import { CommonModule }            from '@angular/common';
import { ActivatedRoute, Router }  from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormsModule }             from '@angular/forms';
import { environment }             from '../../../environments/environments';
import { OrderDto }                from '../orders/orders.component';

interface TimelineStep { label: string; done: boolean; current: boolean; }

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css',
})
export class OrderDetailComponent implements OnInit {

  order: OrderDto | null = null;
  loading       = true;
  error         = '';
  actionLoading = false;
  actionError   = '';
  timeline: TimelineStep[] = [];

  // For inline status dropdown
  selectedStatus = '';
  statusUpdating = false;
  statusSuccess  = false;

  readonly allStatuses = ['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private http:   HttpClient,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadOrder(Number(id));
    else { this.error = 'Order ID not found.'; this.loading = false; }
  }

  // ─────────────────────────────────────────────
  // LOAD
  // ─────────────────────────────────────────────

  private loadOrder(id: number): void {
    this.http.get<OrderDto>(
      `${environment.apiUrl}/admin/order/${id}`,
      this.authHeaders()
    ).subscribe({
      next: (res) => {
        this.order          = res;
        this.selectedStatus = res.status;
        this.timeline       = this.buildTimeline(res.status);
        this.loading        = false;
      },
      error: (err) => {
        this.error   = err.error?.message || 'Failed to load order.';
        this.loading = false;
      }
    });
  }

  // ─────────────────────────────────────────────
  // DISPATCH (POST /admin/dispatch/{id})
  // ─────────────────────────────────────────────

  dispatchOrder(): void {
    if (!this.order) return;
    if (!confirm(`Mark order #${this.order.id} as dispatched?`)) return;

    this.actionLoading = true;
    this.actionError   = '';

    this.http.post<string>(
      `${environment.apiUrl}/admin/dispatch/${this.order.id}`, {},
      this.authHeaders()
    ).subscribe({
      next: () => {
        this.actionLoading  = false;
        this.order          = { ...this.order!, status: 'DISPATCHED' };
        this.selectedStatus = 'DISPATCHED';
        this.timeline       = this.buildTimeline('DISPATCHED');
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError   = err.error || 'Could not dispatch order.';
      }
    });
  }

  // ─────────────────────────────────────────────
  // UPDATE STATUS via dropdown (PATCH /admin/order/{id}/status)
  // ─────────────────────────────────────────────

  onStatusChange(): void {
    if (!this.order || this.selectedStatus === this.order.status) return;

    // Special case: dispatch uses dedicated endpoint
    if (this.selectedStatus === 'DISPATCHED') {
      this.dispatchOrder();
      return;
    }

    if (!confirm(`Change order #${this.order.id} status to "${this.selectedStatus}"?`)) {
      this.selectedStatus = this.order.status; // revert dropdown
      return;
    }

    this.statusUpdating = true;
    this.actionError    = '';

    const params = new HttpParams().set('status', this.selectedStatus);

    this.http.patch<string>(
      `${environment.apiUrl}/admin/order/${this.order.id}/status`,
      {},
      { ...this.authHeaders(), params }
    ).subscribe({
      next: () => {
        this.statusUpdating = false;
        this.statusSuccess  = true;
        this.order          = { ...this.order!, status: this.selectedStatus };
        this.timeline       = this.buildTimeline(this.selectedStatus);
        setTimeout(() => this.statusSuccess = false, 2500);
      },
      error: (err) => {
        this.statusUpdating = false;
        this.actionError    = err.error?.message || 'Could not update status.';
        this.selectedStatus = this.order!.status; // revert on error
      }
    });
  }

  // ─────────────────────────────────────────────
  // CANCEL (calls status update)
  // ─────────────────────────────────────────────

  cancelOrder(): void {
    if (!this.order) return;
    if (!confirm(`Cancel order #${this.order.id}?`)) return;

    this.actionLoading = true;
    this.actionError   = '';

    const params = new HttpParams().set('status', 'CANCELLED');

    this.http.patch<string>(
      `${environment.apiUrl}/admin/order/${this.order.id}/status`,
      {},
      { ...this.authHeaders(), params }
    ).subscribe({
      next: () => {
        this.actionLoading  = false;
        this.order          = { ...this.order!, status: 'CANCELLED' };
        this.selectedStatus = 'CANCELLED';
        this.timeline       = this.buildTimeline('CANCELLED');
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError   = err.error?.message || 'Could not cancel order.';
      }
    });
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  getSubtotal(): number {
    if (!this.order) return 0;
    return (this.order.totalAmount || 0) - (this.order.shippingCharge || 0);
  }

  resolveImage(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${environment.imageBaseUrl}${url}`;
  }

  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }

  private buildTimeline(status: string): TimelineStep[] {
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

  private authHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('admin_token') || '';
    return { headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` }) };
  }
}