// src/app/admin/categories/category-form/category-form.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { Category }       from '../../../services/category.service';
import { CategoryRequest } from '../../../models/category.model';

@Component({
  selector:    'app-category-form',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './category-form.component.html',
  styleUrl:    './category-form.component.css'
})
export class CategoryFormComponent implements OnChanges {

  @Input()  visible  = false;
  @Input()  editData: Category | null = null;   // null = add mode
  @Input()  saving   = false;

  @Output() save   = new EventEmitter<CategoryRequest>();
  @Output() cancel = new EventEmitter<void>();

  form: CategoryRequest = { name: '', description: '' };

  get isEdit(): boolean { return !!this.editData; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editData'] || changes['visible']) {
      this.form = this.editData
        ? { name: this.editData.name, description: '' }
        : { name: '', description: '' };
    }
  }

  submit(): void {
    if (!this.form.name.trim()) return;
    this.save.emit({ ...this.form });
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cancel.emit();
    }
  }
}