// src/app/admin/dispatched/dispatched-order-detail/dispatched-order-detail.component.ts
import { Component, OnInit }       from '@angular/core';
import { CommonModule }            from '@angular/common';
import { ActivatedRoute, Router }  from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { FormsModule }             from '@angular/forms';
import { environment }             from '../../../../environments/environments';

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

interface TimelineStep { label: string; done: boolean; current: boolean; }

@Component({
  selector: 'app-dispatched-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dispatched-order-detail.component.html',
  styleUrl:    './dispatched-order-detail.component.css',
})
export class DispatchedOrderDetailComponent implements OnInit {

  order:         OrderDetailResponse | null = null;
  loading        = true;
  error          = '';
  actionError    = '';
  timeline:      TimelineStep[] = [];

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

  private loadOrder(id: number): void {
    this.http.get<OrderDetailResponse>(
      `${environment.apiUrl}/admin/order/${id}`,
      { headers: this.authHeaders() }
    ).subscribe({
      next: (res) => {
        this.order    = res;
        this.timeline = this.buildTimeline(res.status);
        this.loading  = false;
      },
      error: (err) => {
        this.error   = err.error?.message || 'Failed to load order.';
        this.loading = false;
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  getSubtotal(): number {
    if (!this.order?.items?.length) return 0;
    return this.order.items.reduce((sum, i) => sum + i.price, 0);
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
    this.router.navigate(['/admin/dispatched']);
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

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('admin_token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
}