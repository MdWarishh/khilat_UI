// src/app/app.routes.ts
import { Routes }              from '@angular/router';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';

// ── Auth Guard ─────────────────────────────────────────────────────
const adminGuard = () => {
  if (localStorage.getItem('admin_token')) return true;
  window.location.href = '/admin/login';
  return false;
};

export const routes: Routes = [

  // ──────────────── User / Public Routes ────────────────
  {
    path: '',
    loadComponent: () => import('./components/home/home').then(m => m.Home),
  },
  {
    path: 'about',
    loadComponent: () => import('./components/about/about').then(m => m.About),
  },
  {
    path: 'categories',
    loadComponent: () => import('./components/categories/categories').then(m => m.Categories),
  },
  {
    path: 'contact',
    loadComponent: () => import('./components/contact/contact').then(m => m.Contact),
  },
  // {
  //   path: 'products',
  //   loadComponent: () => import('./components/products/products').then(m => m.Products),
  // },
  {
    path: 'products/:id',
    loadComponent: () => import('./components/product-detail/product-detail').then(m => m.ProductDetail),
  },
  {
    path: 'cart',
    loadComponent: () => import('./components/cart/cart').then(m => m.Cart),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./components/checkout/checkout').then(m => m.Checkout),
  },

  // ──────────────── Admin Routes ────────────────
  // Login page — NO admin layout (no navbar/footer)
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/login.component').then(m => m.AdminLoginComponent),
  },

  // Admin panel — AdminLayoutComponent wraps all child pages
  // Header/Footer component app.html mein *ngIf se admin routes pe hide karte hain
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () => import('./admin/products/products.component').then(m => m.AdminProductsComponent),
      },
       { path: 'orders',    loadComponent: () => import('./admin/orders/orders.component').then(m => m.AdminOrdersComponent) },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // ──────────────── Wildcard ────────────────
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];