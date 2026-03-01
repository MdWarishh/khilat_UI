// admin/products/product-form-modal/product-form-modal.component.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { Category, Product, ProductFormData } from '../../../models/product.model';
import { environment }   from '../../../../environments/environments';

@Component({
  selector: 'app-product-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form-modal.component.html',
  styleUrl:    './product-form-modal.component.css'
})
export class ProductFormModalComponent implements OnChanges {

  @Input() show:           boolean       = false;
  @Input() saving:         boolean       = false;
  @Input() error:          string        = '';
  @Input() categories:     Category[]   = [];
  @Input() editingProduct: Product | null = null; // null = add mode

  // Events
  @Output() onClose  = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<{
    formData:       ProductFormData;
    selectedFiles:  File[];
    deleteImageIds: number[];
    // Edit mode mein primary image id
    primaryImageId: number | null;
    // editingProduct ka updated productImages order (reorder ke liye)
    reorderedImages: { id: number }[];
  }>();

  // Form data
  formData: ProductFormData = {
    name: '', description: '', price: 0, stock: 0,
    categoryId: 0, trending: 'n', isActive: true
  };

  // Image state
  selectedFiles:         File[]    = [];
  selectedFilesPreviews: string[]  = [];
  deleteImageIds:        number[]  = [];

  // Local copy of images for reordering (edit mode)
  localImages: { id: number; imageUrl: string }[] = [];

  // Jab modal khule ya editingProduct change ho tab form reset karo
  ngOnChanges(): void {
    if (this.show) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    if (this.editingProduct) {
      // Edit mode
      this.formData = {
        name:        this.editingProduct.name,
        description: this.editingProduct.description || '',
        price:       this.editingProduct.price,
        stock:       this.editingProduct.stock,
        categoryId:  Number(this.editingProduct.category?.id || 0),
        trending:    this.editingProduct.trending || 'n',
        isActive:    this.editingProduct.isActive,
      };
      this.localImages = [...(this.editingProduct.productImages || [])];
    } else {
      // Add mode
      this.formData = { name: '', description: '', price: 0, stock: 0, categoryId: 0, trending: 'n', isActive: true };
      this.localImages = [];
    }
    this.selectedFiles         = [];
    this.selectedFilesPreviews = [];
    this.deleteImageIds        = [];
  }

  // ── Image management ──

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    this.addFiles(files);
  }

  private addFiles(files: File[]): void {
    files.forEach(file => {
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => this.selectedFilesPreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.selectedFilesPreviews.splice(index, 1);
  }

  toggleDeleteImage(id: number): void {
    const idx = this.deleteImageIds.indexOf(id);
    if (idx >= 0) this.deleteImageIds.splice(idx, 1);
    else          this.deleteImageIds.push(id);
  }

  isMarkedForDelete(id: number): boolean {
    return this.deleteImageIds.includes(id);
  }

  setPrimaryImage(index: number): void {
    const [moved] = this.localImages.splice(index, 1);
    this.localImages.unshift(moved);
  }

  resolveImage(imageUrl: string | undefined | null): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    return `${environment.imageBaseUrl}${imageUrl}`;
  }

  // ── Submit ──

  submitForm(): void {
    const primaryImageId = this.localImages
      .filter(img => !this.deleteImageIds.includes(img.id))[0]?.id ?? null;

    this.onSubmit.emit({
      formData:        this.formData,
      selectedFiles:   this.selectedFiles,
      deleteImageIds:  this.deleteImageIds,
      primaryImageId,
      reorderedImages: this.localImages,
    });
  }
}