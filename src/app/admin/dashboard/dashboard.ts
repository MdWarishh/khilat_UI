// src/app/admin/dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html'
})
export class AdminDashboardComponent implements OnInit {
  totalProducts: number = 0;

  constructor(private authService: AuthService, private router: Router, private productService: ProductService) {}

  ngOnInit(): void {
    this.loadTotalProducts();
  }

  loadTotalProducts(): void {
    this.productService.getAllProducts().subscribe(products => {
      this.totalProducts = products.length;
    });
  }

  logout(): void {
    this.authService.logout();
  }
}