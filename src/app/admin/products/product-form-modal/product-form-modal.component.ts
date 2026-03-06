// admin/products/product-form-modal/product-form-modal.component.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { Category, Product, ProductFormData } from '../../../models/product.model';
import { environment } from '../../../../environments/environments';

@Component({
  selector: 'app-product-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form-modal.component.html',
  styleUrl:    './product-form-modal.component.css'
})
export class ProductFormModalComponent implements OnChanges {

  @Input() show:           boolean      = false;
  @Input() saving:         boolean      = false;
  @Input() error:          string       = '';
  @Input() categories:     Category[]   = [];
  @Input() editingProduct: Product | null = null;

  @Output() onClose  = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<{
    formData:        ProductFormData;
    selectedFiles:   File[];
    deleteImageIds:  number[];
    primaryImageId:  number | null;
    reorderedImages: { id: number }[];
  }>();

  formData: ProductFormData = {
    name: '', description: '', categoryId: 0,
    trending: 'N', isActive: true, variants: []
  };

  selectedFiles:         File[]    = [];
  selectedFilesPreviews: string[]  = [];
  deleteImageIds:        number[]  = [];
  localImages: { id: number; imageUrl: string }[] = [];

  readonly SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];

  // Only reset when modal opens (show: false→true)
  private wasVisible = false;

  ngOnChanges(): void {
    if (this.show && !this.wasVisible) {
      this.resetForm();
    }
    this.wasVisible = this.show;
  }

  private resetForm(): void {
    if (this.editingProduct) {
      this.formData = {
        name:        this.editingProduct.name,
        description: this.editingProduct.description || '',
        categoryId:  Number(this.editingProduct.category?.id || 0),
        trending:    this.editingProduct.trending || 'N',
        isActive:    this.editingProduct.isActive,
        variants:    this.editingProduct.variants?.map(v => ({ ...v })) || [],
      };
      this.localImages = [...(this.editingProduct.productImages || [])];
    } else {
      this.formData    = { name: '', description: '', categoryId: 0, trending: 'N', isActive: true, variants: [] };
      this.localImages = [];
    }
    this.selectedFiles         = [];
    this.selectedFilesPreviews = [];
    this.deleteImageIds        = [];
  }

  // ── Variants ──

  addVariant(): void    { this.formData.variants.push({ size: '', price: 0, stock: 0 }); }
  removeVariant(i: number): void { this.formData.variants.splice(i, 1); }

  getAvailableSizes(currentIndex: number): string[] {
    return this.SIZE_OPTIONS.filter(s =>
      !this.formData.variants.some((v, i) => i !== currentIndex && v.size === s)
    );
  }

  // ── Images ──

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.addFiles(Array.from(event.dataTransfer?.files || []).filter(f => f.type.startsWith('image/')));
  }

  private addFiles(files: File[]): void {
    files.forEach(file => {
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => this.selectedFilesPreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeSelectedFile(i: number): void {
    this.selectedFiles.splice(i, 1);
    this.selectedFilesPreviews.splice(i, 1);
  }

  toggleDeleteImage(id: number): void {
    const idx = this.deleteImageIds.indexOf(id);
    idx >= 0 ? this.deleteImageIds.splice(idx, 1) : this.deleteImageIds.push(id);
  }

  isMarkedForDelete(id: number): boolean { return this.deleteImageIds.includes(id); }

  setPrimaryImage(index: number): void {
    const [moved] = this.localImages.splice(index, 1);
    this.localImages.unshift(moved);
  }

  resolveImage(imageUrl: string | undefined | null): string {
    if (!imageUrl) return '';
    return imageUrl.startsWith('http') ? imageUrl : `${environment.imageBaseUrl}/${imageUrl}`;
  }

  // ── Submit ──

  submitForm(): void {
    const primaryImageId = this.localImages.find(img => !this.deleteImageIds.includes(img.id))?.id ?? null;
    this.onSubmit.emit({
      formData:        this.formData,
      selectedFiles:   this.selectedFiles,
      deleteImageIds:  this.deleteImageIds,
      primaryImageId,
      reorderedImages: this.localImages,
    });
  }
}