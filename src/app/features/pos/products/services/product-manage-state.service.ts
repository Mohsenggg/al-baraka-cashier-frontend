import { Injectable, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, catchError, finalize, tap, throwError, forkJoin } from 'rxjs';
import { ProductApiService } from './product-api.service';
import type {
      NamedEntity,
      ProductAttributeFormValue,
      ProductAttributeOption,
      ProductBarcodeFormValue,
      ProductManagePayload,
      ProductConversionDto
} from '../models/product.models';
import {
      calculateProfitMargin,
      getBarcodeStockLabel,
      resolveBarcodeStockStatus
} from '../models/product.models';
import type { ProductCompositionDto } from '../models/product-material.models';

@Injectable({
      providedIn: 'root'
})
export class ProductManageStateService {
      private readonly api = inject(ProductApiService);
      private readonly fb = inject(FormBuilder);

      productForm!: FormGroup;

      readonly productId = signal<number | null>(null);
      readonly isEditMode = signal(false);
      readonly isPageLoading = signal(false);
      readonly isSaving = signal(false);
      readonly saveSuccess = signal(false);
      readonly saveError = signal<string | null>(null);
      readonly generatedName = signal('');

      private readonly attributesSignal = signal<ProductAttributeOption[]>([]);
      private readonly categoriesSignal = signal<NamedEntity[]>([]);
      private readonly manufacturersSignal = signal<NamedEntity[]>([]);
      private readonly suppliersSignal = signal<NamedEntity[]>([]);

      readonly attributes = this.attributesSignal.asReadonly();
      readonly categories = this.categoriesSignal.asReadonly();
      readonly manufacturers = this.manufacturersSignal.asReadonly();
      readonly suppliers = this.suppliersSignal.asReadonly();

      readonly pendingAttribute = signal<ProductAttributeOption | null>(null);
      readonly pendingAttributeValue = signal('');
      readonly editingAttributeIndex = signal<number | null>(null);
      readonly attributeEditorError = signal<string | null>(null);

      initialize(): void {
            this.initForm();
            this.addBarcode();
      }

      get compositionFormArray(): FormArray {
            return this.productForm.get('composition') as FormArray;
      }

      get conversionsFormArray(): FormArray {
            return this.productForm.get('conversions') as FormArray;
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

      get pageTitle(): string {
            return this.isEditMode() ? 'تعديل منتج' : 'اضافة منتج جديد';
      }

      onFormValueChanged(): void {
            this.updateGeneratedName();
            this.saveSuccess.set(false);
            this.saveError.set(null);
      }

      resolveEditMode(id: number | null): void {
            if (!id || isNaN(id)) {
                  // Only load lookups if creating a new product
                  this.loadReferenceData();
                  return;
            }

            this.productId.set(id);
            this.isEditMode.set(true);
            this.loadProductForEdit(id);
      }

      private loadReferenceData(): void {
            this.isPageLoading.set(true);
            forkJoin({
                  categories: this.api.getCategories(),
                  manufacturers: this.api.getManufacturers(),
                  suppliers: this.api.getSuppliers(),
                  attributes: this.api.getAttributes()
            }).pipe(
                  tap(data => {
                        this.categoriesSignal.set(data.categories);
                        this.manufacturersSignal.set(data.manufacturers);
                        this.suppliersSignal.set(data.suppliers);
                        this.attributesSignal.set(data.attributes);
                  }),
                  catchError(err => {
                        this.saveError.set('فشل في تحميل البيانات المرجعية');
                        return throwError(() => err);
                  }),
                  finalize(() => this.isPageLoading.set(false))
            ).subscribe();
      }

      loadProductForEdit(id: number): void {
            this.isPageLoading.set(true);

            forkJoin({
                  categories: this.api.getCategories(),
                  manufacturers: this.api.getManufacturers(),
                  suppliers: this.api.getSuppliers(),
                  attributes: this.api.getAttributes(),
                  product: this.api.getProductById(id)
            }).pipe(
                  tap(data => {
                        this.categoriesSignal.set(data.categories);
                        this.manufacturersSignal.set(data.manufacturers);
                        this.suppliersSignal.set(data.suppliers);
                        this.attributesSignal.set(data.attributes);
                        
                        this.applyProductDetail(data.product);
                  }),
                  catchError(err => {
                        this.saveError.set(this.extractErrorMessage(err));
                        return throwError(() => err);
                  }),
                  finalize(() => this.isPageLoading.set(false))
            ).subscribe();
      }

      saveProduct(): Observable<ProductManagePayload> | null {
            this.productForm.markAllAsTouched();
            this.compositionFormArray.controls.forEach(ctrl => ctrl.markAllAsTouched());
            this.conversionsFormArray.controls.forEach(ctrl => ctrl.markAllAsTouched());

            if (this.productForm.invalid) {
                  this.saveError.set('يرجى تعبئة الحقول المطلوبة بشكل صحيح قبل الحفظ');
                  return null;
            }

            const payload = this.buildProductPayload();
            this.isSaving.set(true);
            this.saveError.set(null);
            this.saveSuccess.set(false);

            const save$ = this.isEditMode() && this.productId()
                  ? this.api.updateProduct(this.productId()!, payload)
                  : this.api.createProduct(payload);

            return save$.pipe(
                  tap(saved => {
                        this.isSaving.set(false);
                        this.saveSuccess.set(true);
                  }),
                  catchError(err => {
                        this.isSaving.set(false);
                        this.saveError.set(this.extractErrorMessage(err));
                        return throwError(() => err);
                  })
            );
      }

      buildProductPayload(): ProductManagePayload {
            const formValue = this.productForm.value;

            return {
                  baseName: formValue.baseName,
                  name: this.generatedName() || formValue.baseName,
                  status: formValue.status,
                  attributes: formValue.attributes,
                  barcodes: formValue.barcodes,
                  categoryId: formValue.categoryId,
                  manufacturerId: formValue.manufacturerId,
                  supplierIds: formValue.supplierIds,
                  hasConversions: formValue.hasConversions,
                  conversions: formValue.hasConversions ? formValue.conversions : [],
                  hasComposition: formValue.hasComposition,
                  composition: formValue.hasComposition ? formValue.composition : []
            };
      }

      updateGeneratedName(): void {
            const baseName = this.productForm.get('baseName')?.value || '';
            const attrs = this.attributesFormArray.value
                  .filter((a: ProductAttributeFormValue) => a.value)
                  .map((a: ProductAttributeFormValue) => a.value)
                  .join(' ');
            const name = `${baseName} ${attrs}`.trim();
            this.generatedName.set(name);
      }

      selectPendingAttribute(attr: ProductAttributeOption): void {
            this.pendingAttribute.set(attr);
            this.attributeEditorError.set(null);
            if (this.editingAttributeIndex() === null) {
                  this.pendingAttributeValue.set('');
            }
      }

      confirmAttributeValue(): void {
            const pending = this.pendingAttribute();
            const value = this.pendingAttributeValue().trim();

            if (!pending) {
                  this.attributeEditorError.set('اختر سمة أولاً');
                  return;
            }
            if (!value) {
                  this.attributeEditorError.set('أدخل قيمة السمة');
                  return;
            }

            const editingIndex = this.editingAttributeIndex();
            const isDuplicate = this.attributesFormArray.controls.some((ctrl, i) => {
                  if (editingIndex !== null && i === editingIndex) return false;
                  return ctrl.get('name')?.value === pending.name;
            });

            if (isDuplicate) {
                  this.attributeEditorError.set('هذه السمة مضافة مسبقاً');
                  return;
            }

            if (editingIndex !== null) {
                  this.attributesFormArray.at(editingIndex).patchValue({
                        id: pending.id,
                        name: pending.name,
                        value
                  });
            } else {
                  this.attributesFormArray.push(this.fb.group({
                        id: [pending.id],
                        name: [pending.name],
                        value: [value]
                  }));
            }

            this.clearAttributeEditor();
            this.updateGeneratedName();
      }

      clearAttributeEditor(): void {
            this.pendingAttribute.set(null);
            this.pendingAttributeValue.set('');
            this.editingAttributeIndex.set(null);
            this.attributeEditorError.set(null);
      }

      loadAttributeForEdit(index: number): void {
            const ctrl = this.attributesFormArray.at(index);
            this.editingAttributeIndex.set(index);
            this.pendingAttribute.set({
                  id: ctrl.get('id')?.value,
                  name: ctrl.get('name')?.value
            });
            this.pendingAttributeValue.set(ctrl.get('value')?.value || '');
            this.attributeEditorError.set(null);
      }

      removeAttribute(index: number): void {
            this.attributesFormArray.removeAt(index);
            const editingIndex = this.editingAttributeIndex();
            if (editingIndex === index) {
                  this.clearAttributeEditor();
            } else if (editingIndex !== null && editingIndex > index) {
                  this.editingAttributeIndex.set(editingIndex - 1);
            }
            this.updateGeneratedName();
      }

      getAvailableAttributesForDropdown(): ProductAttributeOption[] {
            const editingIndex = this.editingAttributeIndex();
            const confirmedNames = new Set(
                  this.attributesFormArray.controls
                        .map((c, i) => (editingIndex !== null && i === editingIndex)
                              ? null : c.get('name')?.value as string)
                        .filter((name): name is string => !!name)
            );
            return this.attributes()
                  .filter(a => !confirmedNames.has(a.name));
      }

      get pendingAttributeLabel(): string {
            return this.pendingAttribute()?.name || 'اختر أو أضف سمة...';
      }

      get canConfirmAttribute(): boolean {
            return !!(this.pendingAttribute() && this.pendingAttributeValue().trim());
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
            if (!this.barcodesFormArray.value.some((c: ProductBarcodeFormValue) => c.isDefault)) {
                  this.setDefaultBarcode(0);
            }
      }

      setDefaultBarcode(index: number): void {
            this.barcodesFormArray.controls.forEach((control, i) => {
                  control.get('isDefault')?.setValue(i === index, { emitEvent: false });
            });
      }

      addConversion(): void {
            this.conversionsFormArray.push(this.fb.group({
                  parentProductId: [null, Validators.required],
                  parentQuantity: [1, [Validators.required, Validators.min(0.01)]],
                  childQuantity: [1, [Validators.required, Validators.min(0.01)]]
            }));
      }

      removeConversion(index: number): void {
            this.conversionsFormArray.removeAt(index);
      }

      addCompositionRow(): void {
            this.compositionFormArray.push(this.fb.group({
                  materialId: [null, Validators.required],
                  materialName: [''],
                  quantity: [1, [Validators.required, Validators.min(0.01)]],
                  unitId: [null, Validators.required],
                  costPerUnit: [0],
                  wastePercentage: [0, [Validators.min(0), Validators.max(100)]],
                  notes: ['']
            }));
      }

      removeCompositionRow(index: number): void {
            this.compositionFormArray.removeAt(index);
      }

      getProfitMargin(buying: number, selling: number) {
            return calculateProfitMargin(buying, selling);
      }

      getTotalStock(): number {
            return this.barcodesFormArray.controls.reduce((sum, control) => {
                  return sum + (Number(control.get('stock')?.value) || 0);
            }, 0);
      }

      getStockClass(): string {
            return resolveBarcodeStockStatus(this.getTotalStock());
      }

      getStockLabel(): string {
            return getBarcodeStockLabel(this.getTotalStock());
      }

      selectCategory(cat: NamedEntity): void {
            this.productForm.get('categoryId')?.setValue(cat.id);
      }

      getSelectedCategoryName(): string {
            const id = this.productForm.get('categoryId')?.value;
            return this.categories().find(c => c.id === id)?.name || 'اختر القسم...';
      }

      selectManufacturer(man: NamedEntity): void {
            this.productForm.get('manufacturerId')?.setValue(man.id);
      }

      getSelectedManufacturerName(): string {
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

      getSelectedSuppliers(): NamedEntity[] {
            const ids = (this.productForm.get('supplierIds')?.value as number[]) || [];
            return this.suppliers().filter(s => ids.includes(s.id));
      }

      removeSupplier(id: number): void {
            const control = this.productForm.get('supplierIds');
            const currentValues = (control?.value as number[]) || [];
            control?.setValue(currentValues.filter(v => v !== id));
      }

      addNewReferenceItem(type: 'category' | 'manufacturer' | 'supplier' | 'attribute', name: string): void {
            if (!name.trim()) return;

            if (type === 'category') {
                  this.selectCategory(this.addCategory(name.trim()));
            } else if (type === 'manufacturer') {
                  this.selectManufacturer(this.addManufacturer(name.trim()));
            } else if (type === 'supplier') {
                  this.toggleSupplier(this.addSupplier(name.trim()));
            } else if (type === 'attribute') {
                  this.selectPendingAttribute(this.addAttributeOption(name.trim()));
            }
      }

      private initForm(): void {
            this.productForm = this.fb.group({
                  baseName: ['', Validators.required],
                  status: ['active', Validators.required],
                  attributes: this.fb.array([]),
                  barcodes: this.fb.array([]),
                  categoryId: [null],
                  manufacturerId: [null],
                  supplierIds: [[]],
                  hasConversions: [false],
                  conversions: this.fb.array([]),
                  hasComposition: [false],
                  composition: this.fb.array([])
            });
      }

      private applyProductDetail(detail: ProductManagePayload): void {
            this.productForm.patchValue({
                  baseName: detail.baseName,
                  status: detail.status || 'active',
                  categoryId: detail.categoryId,
                  manufacturerId: detail.manufacturerId,
                  supplierIds: detail.supplierIds,
                  hasConversions: detail.hasConversions,
                  hasComposition: detail.hasComposition
            });

            this.attributesFormArray.clear();
            (detail.attributes || []).forEach(attr => {
                  this.attributesFormArray.push(this.fb.group({
                        id: [attr.id],
                        name: [attr.name],
                        value: [attr.value]
                  }));
            });

            this.barcodesFormArray.clear();
            if (detail.barcodes && detail.barcodes.length) {
                  detail.barcodes.forEach(barcode => {
                        this.barcodesFormArray.push(this.fb.group({
                              barcode: [barcode.barcode],
                              sellingPrice: [barcode.sellingPrice],
                              buyingPrice: [barcode.buyingPrice],
                              stock: [barcode.stock],
                              isDefault: [barcode.isDefault]
                        }));
                  });
            } else {
                  this.addBarcode();
            }

            this.conversionsFormArray.clear();
            if (detail.conversions && detail.conversions.length) {
                  detail.conversions.forEach(conv => {
                        this.conversionsFormArray.push(this.fb.group({
                              parentProductId: [conv.parentProductId, Validators.required],
                              parentQuantity: [conv.parentQuantity, [Validators.required, Validators.min(0.01)]],
                              childQuantity: [conv.childQuantity, [Validators.required, Validators.min(0.01)]]
                        }));
                  });
            }

            this.compositionFormArray.clear();
            if (detail.composition && detail.composition.length) {
                  detail.composition.forEach(comp => {
                        this.compositionFormArray.push(this.fb.group({
                              materialId: [comp.materialId, Validators.required],
                              quantity: [comp.quantity, [Validators.required, Validators.min(0.01)]],
                              unitId: [comp.unitId, Validators.required],
                              wastePercentage: [comp.wastePercentage || 0, [Validators.min(0), Validators.max(100)]],
                              notes: [comp.notes || '']
                        }));
                  });
            }

            this.updateGeneratedName();
      }

      private addCategory(name: string): NamedEntity {
            const newItem = { id: this.generateId(), name };
            this.categoriesSignal.update(list => [...list, newItem]);
            return newItem;
      }

      private addManufacturer(name: string): NamedEntity {
            const newItem = { id: this.generateId(), name };
            this.manufacturersSignal.update(list => [...list, newItem]);
            return newItem;
      }

      private addSupplier(name: string): NamedEntity {
            const newItem = { id: this.generateId(), name };
            this.suppliersSignal.update(list => [...list, newItem]);
            return newItem;
      }

      private addAttributeOption(name: string): ProductAttributeOption {
            const newItem = { id: this.generateId(), name };
            this.attributesSignal.update(list => [...list, newItem]);
            return newItem;
      }

      private generateId(): number {
            return Math.floor(Math.random() * 1000) + 10;
      }

      private extractErrorMessage(err: unknown): string {
            return (err as { error?: { message?: string }; message?: string })?.error?.message
                  || (err as { message?: string })?.message
                  || 'حدث خطأ غير متوقع';
      }
}
