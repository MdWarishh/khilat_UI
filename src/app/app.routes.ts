// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';

export const routes: Routes = [
  // ──────────────── Public / User Routes (ye sab user layout ke andar) ────────────────
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
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/login.component')
      .then(m => m.AdminLoginComponent),
  },

  {
    path: 'admin',
    component: AdminLayoutComponent,  // ← sidebar + navbar yahan se aayega
    canActivate: [() => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        // Token nahi to login pe redirect
        window.location.href = '/admin/login';
        return false;
      }
      return true;
    }],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () => import('./admin/products/products.component')
          .then(m => m.AdminProductsComponent),
      },
      // Baad mein yahan aur routes add kar (orders, settings etc.)
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Wildcard
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];