// order-detail.component.ts
import { Component, OnInit }       from '@angular/core';
import { CommonModule }            from '@angular/common';
import { ActivatedRoute, Router }  from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormsModule }             from '@angular/forms';
import { environment }             from '../../../environments/environments';

// ── Matches ACTUAL backend response ──────────────────────────
interface PaymentDto {
  id:            number;
  amount:        number;
  createdAt:     string;
  paymentstatus: string;
}

interface OrderItemDto {
  id:            number;
  orderid:       number;
  productId:     number;
  quantity:      number;
  price:         number;
  productName:   string;
  imageUrl?:     string;
  stockLeft?:    number;
  categoryName?: string;
  size?:         string;
  color?:        string;
}

export interface OrderDetailResponse {
  id:        number;
  guestId:   string | null;
  payment:   PaymentDto | null;
  email:     string;
  name:      string;
  address:   string;
  status:    string;
  phone:     number | null;
  createdAt: string;
  items:     OrderItemDto[];
}
// ─────────────────────────────────────────────────────────────

interface TimelineStep { label: string; done: boolean; current: boolean; }

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css',
})
export class OrderDetailComponent implements OnInit {

  order: OrderDetailResponse | null = null;
  loading       = true;
  error         = '';
  actionLoading = false;
  actionError   = '';
  timeline: TimelineStep[] = [];

  selectedStatus = '';
  statusUpdating = false;
  statusSuccess  = false;

  // Only allow up to CONFIRMED from this page
  readonly allStatuses = ['PENDING', 'CONFIRMED'];

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
    this.http.get<OrderDetailResponse>(
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
        this.error   = err.error?.message || err.error || 'Failed to load order.';
        this.loading = false;
      }
    });
  }

  // ─────────────────────────────────────────────
  // STATUS CHANGE — PATCH /admin/order/{id}/status
  // ─────────────────────────────────────────────

  onStatusChange(): void {
    if (!this.order || this.selectedStatus === this.order.status) return;

    if (!confirm(`Change order #${this.order.id} status to "${this.selectedStatus}"?`)) {
      this.selectedStatus = this.order.status;
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
        this.selectedStatus = this.order!.status;
      }
    });
  }

  // ─────────────────────────────────────────────
  // CANCEL
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
    if (!this.order?.items?.length) return 0;
    return this.order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  }

  getTotalAmount(): number {
    return this.order?.payment?.amount ?? this.getSubtotal();
  }

  getShippingCharge(): number {
    const diff = this.getTotalAmount() - this.getSubtotal();
    return diff > 0 ? diff : 0;
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