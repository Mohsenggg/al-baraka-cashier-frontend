import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../../../../shared/components/sidebar/sidebar.component';
import {
      ProductReferenceDataService,
      ProductAttributeOption,
      NamedEntity
} from '../../services/product-reference-data.service';
import { ProductMaterialCatalogService } from '../../services/product-material-catalog.service';
import { ProductMaterialsTabComponent } from '../product-materials-tab/product-materials-tab.component';
import { duplicateMaterialValidator } from '../../validators/product-material.validators';
import { ProductMaterialDto } from '../../models/product-material.models';

import { FloatingDropdownComponent } from '../../../../../shared/components/floating-dropdown/floating-dropdown.component';

@Component({
      selector: 'app-manage-product',
      standalone: true,
      imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, SidebarComponent, ProductMaterialsTabComponent, FloatingDropdownComponent],
      templateUrl: './manage-product.component.html',
      styleUrl: './manage-product.component.css'
})
export class ManageProductComponent implements OnInit, OnDestroy {
      private readonly fb = inject(FormBuilder);
      private readonly router = inject(Router);
      private readonly route = inject(ActivatedRoute);
      private readonly referenceData = inject(ProductReferenceDataService);
      private readonly materialCatalog = inject(ProductMaterialCatalogService);
      private readonly destroy$ = new Subject<void>();

      productForm!: FormGroup;
      activeTab: 'basic' | 'materials' = 'basic';
      generatedName = '';
      sidebarVisible = signal(false);
      productId = signal<number | null>(null);
      isEditMode = signal(false);
      isPageLoading = signal(false);

      activeDropdown: 'attribute' | 'category' | 'manufacturer' | 'supplier' | null = null;


      showOverlay: 'category' | 'manufacturer' | 'supplier' | 'attribute' | null = null;
      pendingAttribute: ProductAttributeOption | null = null;
      pendingAttributeValue = '';
      editingAttributeIndex: number | null = null;
      attributeEditorError: string | null = null;

      @ViewChild('attributeTrigger') attributeTrigger?: ElementRef<HTMLButtonElement>;

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
            this.resolveEditMode();
      }

      private resolveEditMode(): void {
            const idParam = this.route.snapshot.paramMap.get('id');
            if (!idParam) return;

            const id = Number(idParam);
            if (isNaN(id)) return;

            this.productId.set(id);
            this.isEditMode.set(true);
            this.loadProductForEdit(id);
      }

      private loadProductForEdit(id: number): void {
            this.isPageLoading.set(true);

            setTimeout(() => {
                  if (id === 15) {
                        this.productForm.patchValue({
                              baseName: 'شامبو',
                        });
                        this.updateGeneratedName();
                        this.loadMaterialsForEdit(id);
                  }
                  this.isPageLoading.set(false);
            }, 400);
      }

      private loadMaterialsForEdit(productId: number): void {
            const rows = this.materialCatalog.loadProductMaterials(productId);
            this.materialsFormArray.clear();

            rows.forEach(row => {
                  this.materialsFormArray.push(
                        ProductMaterialsTabComponent.createMaterialGroup(this.fb, row)
                  );
            });

            this.materialsFormArray.updateValueAndValidity();
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
                  materials: this.fb.array([], [duplicateMaterialValidator()]),
                  categoryId: [null],
                  manufacturerId: [null],
                  supplierIds: [[]]
            });
      }

      get materialsFormArray(): FormArray {
            return this.productForm.get('materials') as FormArray;
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

      selectPendingAttribute(attr: ProductAttributeOption, event?: MouseEvent): void {
            if (event) {
                  event.preventDefault();
                  event.stopPropagation();
            }

            this.pendingAttribute = attr;
            this.attributeEditorError = null;
            if (this.editingAttributeIndex === null) {
                  this.pendingAttributeValue = '';
            }

            this.activeDropdown = null;
      }

      confirmAttributeValue(): void {
            if (!this.pendingAttribute) {
                  this.attributeEditorError = 'اختر سمة أولاً';
                  return;
            }
            if (!this.pendingAttributeValue.trim()) {
                  this.attributeEditorError = 'أدخل قيمة السمة';
                  return;
            }

            const isDuplicate = this.attributesFormArray.controls.some((ctrl, i) => {
                  if (this.editingAttributeIndex !== null && i === this.editingAttributeIndex) return false;
                  return ctrl.get('name')?.value === this.pendingAttribute!.name;
            });

            if (isDuplicate) {
                  this.attributeEditorError = 'هذه السمة مضافة مسبقاً';
                  return;
            }

            if (this.editingAttributeIndex !== null) {
                  this.attributesFormArray.at(this.editingAttributeIndex).patchValue({
                        id: this.pendingAttribute.id,
                        name: this.pendingAttribute.name,
                        value: this.pendingAttributeValue.trim()
                  });
            } else {
                  this.attributesFormArray.push(this.fb.group({
                        id: [this.pendingAttribute.id],
                        name: [this.pendingAttribute.name],
                        value: [this.pendingAttributeValue.trim()]
                  }));
            }

            this.clearAttributeEditor();
            this.updateGeneratedName();
      }

      clearAttributeEditor(): void {
            this.pendingAttribute = null;
            this.pendingAttributeValue = '';
            this.editingAttributeIndex = null;
            this.attributeEditorError = null;
      }

      loadAttributeForEdit(index: number): void {
            const ctrl = this.attributesFormArray.at(index);
            this.editingAttributeIndex = index;
            this.pendingAttribute = {
                  id: ctrl.get('id')?.value,
                  name: ctrl.get('name')?.value
            };
            this.pendingAttributeValue = ctrl.get('value')?.value || '';
            this.attributeEditorError = null;
      }

      removeAttribute(index: number): void {
            this.attributesFormArray.removeAt(index);
            if (this.editingAttributeIndex === index) {
                  this.clearAttributeEditor();
            } else if (this.editingAttributeIndex !== null && this.editingAttributeIndex > index) {
                  this.editingAttributeIndex--;
            }
            this.updateGeneratedName();
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
            }
      }

      closeDropdowns(): void {
            this.activeDropdown = null;
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

      getAvailableAttributesForDropdown(): ProductAttributeOption[] {
            const confirmedNames = new Set(
                  this.attributesFormArray.controls
                        .map((c, i) => (this.editingAttributeIndex !== null && i === this.editingAttributeIndex)
                              ? null : c.get('name')?.value as string)
                        .filter((name): name is string => !!name)
            );
            const term = this.dropdownSearchTerms.attribute.toLowerCase();
            return this.attributes()
                  .filter(a => !confirmedNames.has(a.name))
                  .filter(a => !term || a.name.toLowerCase().includes(term));
      }

      get pendingAttributeLabel(): string {
            return this.pendingAttribute?.name || 'اختر أو أضف سمة...';
      }

      get canConfirmAttribute(): boolean {
            return !!(this.pendingAttribute && this.pendingAttributeValue.trim());
      }

      openOverlay(type: 'category' | 'manufacturer' | 'supplier' | 'attribute'): void {
            this.showOverlay = type;
            this.activeDropdown = null;
      }

      closeOverlay(): void {
            this.showOverlay = null;
      }

      addNewItem(type: 'category' | 'manufacturer' | 'supplier' | 'attribute', name: string): void {
            if (!name.trim()) return;

            if (type === 'category') {
                  this.selectCategory(this.referenceData.addCategory(name.trim()));
            } else if (type === 'manufacturer') {
                  this.selectManufacturer(this.referenceData.addManufacturer(name.trim()));
            } else if (type === 'supplier') {
                  this.toggleSupplier(this.referenceData.addSupplier(name.trim()));
            } else if (type === 'attribute') {
                  this.selectPendingAttribute(this.referenceData.addAttributeOption(name.trim()));
            }

            this.closeOverlay();
      }

      getOverlayLabel(): string {
            switch (this.showOverlay) {
                  case 'category': return 'قسم';
                  case 'manufacturer': return 'شركة مصنعة';
                  case 'supplier': return 'مورد';
                  case 'attribute': return 'سمة';
                  default: return '';
            }
      }

      onCancel(): void {
            this.router.navigate(['/pos/products']);
      }

      get pageTitle(): string {
            return this.isEditMode() ? 'تعديل منتج' : 'اضافة منتج جديد';
      }

      get parentProductName(): string {
            return this.generatedName || this.productForm.get('baseName')?.value || '';
      }

      buildProductPayload(): Record<string, unknown> {
            const materials: ProductMaterialDto[] = this.materialsFormArray.value.map(
                  (m: ProductMaterialDto & { notes?: string }) => ({
                        materialId: m.materialId,
                        quantity: Number(m.quantity),
                        unitId: m.unitId,
                        wastePercentage: m.wastePercentage ?? null,
                        notes: m.notes || ''
                  })
            );

            return {
                  id: this.productId(),
                  name: this.generatedName || this.productForm.get('baseName')?.value,
                  baseName: this.productForm.get('baseName')?.value,
                  attributes: this.attributesFormArray.value,
                  barcodes: this.barcodesFormArray.value,
                  categoryId: this.productForm.get('categoryId')?.value,
                  manufacturerId: this.productForm.get('manufacturerId')?.value,
                  supplierIds: this.productForm.get('supplierIds')?.value,
                  materials
            };
      }

      onSave(): void {
            this.productForm.markAllAsTouched();
            this.materialsFormArray.controls.forEach(ctrl => ctrl.markAllAsTouched());

            if (this.productForm.invalid) {
                  if (this.materialsFormArray.invalid) {
                        this.saveError.set('يرجى تصحيح بيانات المواد قبل الحفظ');
                        this.activeTab = 'materials';
                  } else {
                        this.saveError.set('يرجى تعبئة الحقول المطلوبة قبل الحفظ');
                  }
                  return;
            }

            const payload = this.buildProductPayload();
            this.isSaving.set(true);
            this.saveError.set(null);
            this.saveSuccess.set(false);

            setTimeout(() => {
                  this.isSaving.set(false);
                  this.saveSuccess.set(true);
                  console.log('Product aggregate payload:', payload);
            }, 800);
      }
}
