// admin/admin-layout/admin-layout.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

interface MenuItem {
  id?:     string;
  label:   string;
  icon?:   string;
  route?:  string;
  action?: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl:    './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit, OnDestroy {

  // ── Sidebar state ─────────────────────────────
  sidebarCollapsed  = false;
  mobileSidebarOpen = false;

  // ── Admin info ────────────────────────────────
  adminEmail    = localStorage.getItem('admin_email') || 'admin@khilatkurti.com';
  adminInitials = this.getInitials(this.adminEmail);

  // ── Page title ────────────────────────────────
  currentPageTitle = 'Dashboard';
  today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // ── Menu — id field se HTML mein SVG icon match hoga ──
  menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', route: '/admin/dashboard' },
    { id: 'products',  label: 'Products',  route: '/admin/products'  },
    { id: 'orders',    label: 'Orders',    route: '/admin/orders'    },
    { id: 'customers', label: 'Customers', route: '/admin/customers' },
    { id: 'settings',  label: 'Settings',  route: '/admin/settings'  },
    { id: 'logout',    label: 'Logout',    action: 'logout'          },
  ];

  private routerSub!: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.updatePageTitle());

    this.updatePageTitle();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  // ── Sidebar toggle (desktop collapse) ──────────
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // ── Mobile sidebar ─────────────────────────────
  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  // ── Logout ────────────────────────────────────
  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    this.router.navigate(['/admin/login']);
  }

  // ── Page title from URL ───────────────────────
  private updatePageTitle(): void {
    const url = this.router.url;
    const match = this.menuItems.find(item => item.route && url.startsWith(item.route));
    this.currentPageTitle = match?.label || 'Admin Panel';
  }

  // ── Admin initials from email ─────────────────
  private getInitials(email: string): string {
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  }
}