import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environments';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  stats = {
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  };

  recentOrders: any[] = [];
  loading = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Yeh API abhi backend mein nahi hai – placeholder stats dikha rahe
    // Baad mein real API call kar lenge (jaise /api/admin/stats)
    setTimeout(() => {
      this.stats = {
        totalProducts: 248,
        totalOrders: 156,
        totalRevenue: 289450,
        pendingOrders: 12
      };
      this.recentOrders = [
        { id: 'ORD-7845', customer: 'Amit Sharma', amount: 2798, status: 'pending' },
        { id: 'ORD-7844', customer: 'Priya Singh', amount: 1499, status: 'shipped' },
        // ... more
      ];
      this.loading = false;
    }, 800);
  }
}