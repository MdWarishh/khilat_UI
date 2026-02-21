// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home')
      .then(m => m.Home)
  },
  {
    path: 'about',
    loadComponent: () => import('./components/about/about')
      .then(m => m.About)
  },
  {
    path: 'categories',
    loadComponent: () => import('./components/categories/categories')
      .then(m => m.Categories)
  },
  {
    path: 'contact',
    loadComponent: () => import('./components/contact/contact')
      .then(m => m.Contact)
  },
  {
  path: 'products/:id',
  loadComponent: () =>
    import('./components/product-detail/product-detail')
    .then(m => m.ProductDetail)
},

  // ──────────────── Admin Routes ────────────────
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/login')
      .then(m => m.AdminLoginComponent)   // ← component ka actual name adjust kar lena
  },
  {
    path: 'admin',
    canActivate: [() => import('./guards/admin-guard').then(m => m.AdminGuard)],
 // ya canActivateChild
    children: [
      {
        path: '',
        loadComponent: () => import('./admin/dashboard/dashboard')
          .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./admin/products/products')
          .then(m => m.AdminProductsComponent)
      },
      // baad mein add kar sakte ho: categories, orders, etc.
    ]
  },

  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];