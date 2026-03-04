// src/app/admin/categories/categories.component.ts
import { Component, OnInit }    from '@angular/core';
import { CommonModule }          from '@angular/common';
import { HttpClient }            from '@angular/common/http';
import { environment }           from '../../../environments/environments';

import { CategoryService, Category } from '../../services/category.service';
import { CategoryFormComponent }     from './category-form/category-form.component';
import { CategoryRequest }           from '../../models/category.model';

@Component({
  selector:    'app-categories',
  standalone:  true,
  imports:     [CommonModule, CategoryFormComponent],
  templateUrl: './categories.component.html',
  styleUrl:    './categories.component.css'
})
export class CategoriesComponent implements OnInit {

  categories: Category[] = [];
  loading  = false;
  saving   = false;

  modalVisible = false;
  editData: Category | null = null;

  // Toast
  toast: { msg: string; type: 'success' | 'error' } | null = null;

  // Delete confirm
  deleteConfirmId: number | null = null;

  constructor(
    private categoryService: CategoryService,
    private http: HttpClient
  ) {}

  ngOnInit(): void { this.loadCategories(); }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next:  cats => { this.categories = cats; this.loading = false; },
      error: ()   => { this.loading = false; this.showToast('Failed to load categories', 'error'); }
    });
  }

  // ── Open modal ────────────────────────────────
  openAdd(): void  { this.editData = null;  this.modalVisible = true; }
  openEdit(cat: Category): void { this.editData = cat; this.modalVisible = true; }
  closeModal(): void { this.modalVisible = false; this.editData = null; }

  // ── Save (add or update) ──────────────────────
  onSave(req: CategoryRequest): void {
    this.saving = true;
    const token = localStorage.getItem('admin_token');
    const headers = { Authorization: `Bearer ${token}` };

    if (this.editData) {
      // UPDATE
      this.http.put<Category>(
        `${environment.apiUrl}/admin/updateCategory/${this.editData.id}`, req, { headers }
      ).subscribe({
        next: updated => {
          this.categories = this.categories.map(c => c.id === updated.id ? updated : c);
          this.saving = false;
          this.closeModal();
          this.showToast('Category updated successfully!', 'success');
        },
        error: () => { this.saving = false; this.showToast('Update failed. Try again.', 'error'); }
      });
    } else {
      // ADD
      this.http.post<Category>(
        `${environment.apiUrl}/admin/addCategory`, req, { headers }
      ).subscribe({
        next: created => {
          this.categories = [...this.categories, created];
          this.saving = false;
          this.closeModal();
          this.showToast('Category added successfully!', 'success');
        },
        error: () => { this.saving = false; this.showToast('Add failed. Try again.', 'error'); }
      });
    }
  }

  // ── Delete flow ───────────────────────────────
  onDeleteRequest(id: number): void { this.deleteConfirmId = id; }
  cancelDelete(): void               { this.deleteConfirmId = null; }

  confirmDelete(): void {
    if (this.deleteConfirmId === null) return;
    const id = this.deleteConfirmId;
    const token = localStorage.getItem('admin_token');

    this.http.delete(`${environment.apiUrl}/admin/deleteCategory/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    }).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== id);
        this.deleteConfirmId = null;
        this.showToast('Category deleted!', 'success');
      },
      error: () => {
        this.deleteConfirmId = null;
        this.showToast('Delete failed. Try again.', 'error');
      }
    });
  }

  // ── Toast helper ──────────────────────────────
  showToast(msg: string, type: 'success' | 'error'): void {
    this.toast = { msg, type };
    setTimeout(() => this.toast = null, 3000);
  }
}