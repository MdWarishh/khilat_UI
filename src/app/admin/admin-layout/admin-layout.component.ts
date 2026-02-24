import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  // Sidebar menu items
  menuItems = [
    { label: 'Dashboard', icon: '🏠', route: '/admin/dashboard' },
    { label: 'Products', icon: '👗', route: '/admin/products' },
    { label: 'Orders', icon: '📦', route: '/admin/orders' },
    { label: 'Customers', icon: '👥', route: '/admin/customers' },
    { label: 'Settings', icon: '⚙️', route: '/admin/settings' },
    { label: 'Logout', icon: '🚪', route: '/admin/logout', action: 'logout' }
  ];

  logout() {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login';
  }
}