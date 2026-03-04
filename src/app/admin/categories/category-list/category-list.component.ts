// src/app/admin/categories/category-list/category-list.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../../services/category.service';

@Component({
  selector:    'app-category-list',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './category-list.component.html',
  styleUrl:    './category-list.component.css'
})
export class CategoryListComponent {
  @Input()  categories: Category[] = [];
  @Input()  loading = false;
  @Output() editCategory   = new EventEmitter<Category>();
  @Output() deleteCategory = new EventEmitter<number>();
}