import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../../../../shared/components/sidebar/sidebar.component';
import {
  ProductReferenceDataService,
  ProductAttributeOption,
  NamedEntity
} from '../../services/product-reference-data.service';

@Component({
  selector: 'app-manage-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './manage-product.component.html',
  styleUrl: './manage-product.component.css'
})
export class ManageProductComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly referenceData = inject(ProductReferenceDataService);
  private readonly destroy$ = new Subject<void>();

  productForm!: FormGroup;
  activeTab: 'basic' | 'composition' = 'basic';
  generatedName = '';
  sidebarVisible = signal(false);

  activeDropdown: 'attribute' | 'category' | 'manufacturer' | 'supplier' | null = null;
  dropdownSearchTerms = {
    attribute: '',
    category: '',
    manufacturer: '',
    supplier: ''
  };

  showOverlay: 'category' | 'manufacturer' | 'supplier' | null = null;
  activeAttributeIndex: number | null = null;

  isSaving = signal(false);
  saveSuccess = signal(false);
  saveError = signal<string | null>(null);

  readonly attributes = this.referenceData.attributes;
  readonly categories = this.referenceData.categories;
  readonly manufacturers = this.referenceData.manufacturers;
  readonly suppliers = this.referenceData.suppliers;

  ngOnInit(): void {
    this.initForm();
    this.setupSubscriptions();
    this.addBarcode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToggleSidebar(): void {
    this.sidebarVisible.update(v => !v);
  }

  initForm(): void {
    this.productForm = this.fb.group({
      baseName: ['', Validators.required],
      attributes: this.fb.array([]),
      barcodes: this.fb.array([]),
      categoryId: [null],
      manufacturerId: [null],
      supplierIds: [[]]
    });
  }

  get attributesFormArray(): FormArray {
    return this.productForm.get('attributes') as FormArray;
  }

  get barcodesFormArray(): FormArray {
    return this.productForm.get('barcodes') as FormArray;
  }

  get isBaseNameInvalid(): boolean {
    const control = this.productForm.get('baseName');
    return !!(control?.invalid && control.touched);
  }

  setupSubscriptions(): void {
    this.productForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateGeneratedName();
      this.saveSuccess.set(false);
      this.saveError.set(null);
    });
  }

  updateGeneratedName(): void {
    const baseName = this.productForm.get('baseName')?.value || '';
    const attrs = this.attributesFormArray.value
      .filter((a: { value: string }) => a.value)
      .map((a: { value: string }) => a.value)
      .join(' ');
    this.generatedName = `${baseName} ${attrs}`.trim();
  }

  addAttribute(attr: ProductAttributeOption): void {
    if (this.attributesFormArray.value.some((c: { name: string }) => c.name === attr.name)) {
      this.activeDropdown = null;
      return;
    }

    this.attributesFormArray.push(this.fb.group({
      id: [attr.id],
      name: [attr.name],
      value: ['']
    }));

    this.activeAttributeIndex = this.attributesFormArray.length - 1;
    this.activeDropdown = null;
  }

  removeAttribute(index: number): void {
    this.attributesFormArray.removeAt(index);
    if (this.activeAttributeIndex === index) {
      this.activeAttributeIndex = null;
    } else if (this.activeAttributeIndex !== null && this.activeAttributeIndex > index) {
      this.activeAttributeIndex--;
    }
    this.updateGeneratedName();
  }

  selectAttribute(index: number): void {
    this.activeAttributeIndex = index;
  }

  addBarcode(): void {
    this.barcodesFormArray.push(this.fb.group({
      barcode: [''],
      sellingPrice: [0],
      buyingPrice: [0],
      stock: [0],
      isDefault: [false]
    }));

    if (this.barcodesFormArray.length === 1) {
      this.setDefaultBarcode(0);
    }
  }

  removeBarcode(index: number): void {
    if (this.barcodesFormArray.length <= 1) return;
    this.barcodesFormArray.removeAt(index);
    if (!this.barcodesFormArray.value.some((c: { isDefault: boolean }) => c.isDefault)) {
      this.setDefaultBarcode(0);
    }
  }

  setDefaultBarcode(index: number): void {
    this.barcodesFormArray.controls.forEach((control, i) => {
      control.get('isDefault')?.setValue(i === index, { emitEvent: false });
    });
  }

  calculateProfitMargin(buying: number, selling: number): { value: number; percentage: number } {
    if (!buying || buying <= 0) return { value: 0, percentage: 0 };
    const value = selling - buying;
    const percentage = (value / buying) * 100;
    return { value, percentage };
  }

  getTotalStock(): number {
    return this.barcodesFormArray.controls.reduce((sum, control) => {
      return sum + (Number(control.get('stock')?.value) || 0);
    }, 0);
  }

  getStockClass(): string {
    const total = this.getTotalStock();
    if (total === 0) return 'outofstock';
    if (total <= 10) return 'critical';
    if (total <= 30) return 'low';
    return 'healthy';
  }

  getStockLabel(): string {
    const total = this.getTotalStock();
    if (total === 0) return 'غير متاح';
    return `${total} وحدة`;
  }

  toggleDropdown(type: 'attribute' | 'category' | 'manufacturer' | 'supplier'): void {
    if (this.activeDropdown === type) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = type;
      this.dropdownSearchTerms[type] = '';
    }
  }

  closeDropdowns(): void {
    this.activeDropdown = null;
  }

  getFilteredList(type: 'attribute' | 'category' | 'manufacturer' | 'supplier'): (ProductAttributeOption | NamedEntity)[] {
    const term = this.dropdownSearchTerms[type].toLowerCase();
    let list: (ProductAttributeOption | NamedEntity)[] = [];

    switch (type) {
      case 'attribute': list = this.attributes(); break;
      case 'category': list = this.categories(); break;
      case 'manufacturer': list = this.manufacturers(); break;
      case 'supplier': list = this.suppliers(); break;
    }

    if (!term) return list;
    return list.filter(item => item.name.toLowerCase().includes(term));
  }

  selectCategory(cat: NamedEntity): void {
    this.productForm.get('categoryId')?.setValue(cat.id);
    this.activeDropdown = null;
  }

  get selectedCategoryName(): string {
    const id = this.productForm.get('categoryId')?.value;
    return this.categories().find(c => c.id === id)?.name || 'اختر القسم...';
  }

  selectManufacturer(man: NamedEntity): void {
    this.productForm.get('manufacturerId')?.setValue(man.id);
    this.activeDropdown = null;
  }

  get selectedManufacturerName(): string {
    const id = this.productForm.get('manufacturerId')?.value;
    return this.manufacturers().find(m => m.id === id)?.name || 'اختر الشركة المصنعة...';
  }

  toggleSupplier(sup: NamedEntity): void {
    const control = this.productForm.get('supplierIds');
    const currentValues = (control?.value as number[]) || [];
    if (currentValues.includes(sup.id)) {
      control?.setValue(currentValues.filter(id => id !== sup.id));
    } else {
      control?.setValue([...currentValues, sup.id]);
    }
  }

  isSupplierSelected(sup: NamedEntity): boolean {
    const currentValues = (this.productForm.get('supplierIds')?.value as number[]) || [];
    return currentValues.includes(sup.id);
  }

  get selectedSuppliers(): NamedEntity[] {
    const ids = (this.productForm.get('supplierIds')?.value as number[]) || [];
    return this.suppliers().filter(s => ids.includes(s.id));
  }

  removeSupplier(id: number): void {
    const control = this.productForm.get('supplierIds');
    const currentValues = (control?.value as number[]) || [];
    control?.setValue(currentValues.filter(v => v !== id));
  }

  openOverlay(type: 'category' | 'manufacturer' | 'supplier'): void {
    this.showOverlay = type;
    this.activeDropdown = null;
  }

  closeOverlay(): void {
    this.showOverlay = null;
  }

  addNewItem(type: 'category' | 'manufacturer' | 'supplier', name: string): void {
    if (!name.trim()) return;

    if (type === 'category') {
      this.selectCategory(this.referenceData.addCategory(name.trim()));
    } else if (type === 'manufacturer') {
      this.selectManufacturer(this.referenceData.addManufacturer(name.trim()));
    } else if (type === 'supplier') {
      this.toggleSupplier(this.referenceData.addSupplier(name.trim()));
    }

    this.closeOverlay();
  }

  onCancel(): void {
    this.router.navigate(['/pos/products']);
  }

  onSave(): void {
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      this.saveError.set('يرجى تعبئة الحقول المطلوبة قبل الحفظ');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    setTimeout(() => {
      this.isSaving.set(false);
      this.saveSuccess.set(true);
    }, 800);
  }
}
