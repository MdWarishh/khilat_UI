import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './components/home/home';
import { AdminGuard } from './guards/admin-guard';
import { AdminLoginComponent } from './admin/login/login.component';
import { DashboardComponent } from './admin/dashboard/dashboard.component';
import { AdminProductsComponent } from './admin/products/products.component';

const routes: Routes = [
  {
    path: '',
    component: Home
  },
  { path: 'admin/login', component: AdminLoginComponent },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'products', component: AdminProductsComponent },
      // Add more later, e.g., { path: 'categories', component: AdminCategoriesComponent }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}