import { Injectable, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { ProductApiService } from './product-api.service';
import { ProductSeedService } from './product-seed.service';
import { duplicateMaterialValidator } from '../validators/product-material.validators';
import type {
      NamedEntity,
      ProductAttributeFormValue,
      ProductAttributeOption,
      ProductBarcodeFormValue,
      ProductCompositionContext,
      ProductManageDetail,
      ProductManagePayload
} from '../models/product.models';
import {
      calculateProfitMargin,
      getBarcodeStockLabel,
      resolveBarcodeStockStatus
} from '../models/product.models';
import type { MaterialCatalogItem, MaterialUnit, ProductMaterialDto, ProductMaterialRow } from '../models/product-material.models';
import { positiveQuantityValidator } from '../validators/product-material.validators';

@Injectable({
      providedIn: 'root'
})
export class ProductManageStateService {
      private readonly api = inject(ProductApiService);
      private readonly seed = inject(ProductSeedService);
      private readonly fb = inject(FormBuilder);

      private readonly useSeedData = true;

      productForm!: FormGroup;

      readonly productId = signal<number | null>(null);
      readonly isEditMode = signal(false);
      readonly isPageLoading = signal(false);
      readonly isSaving = signal(false);
      readonly saveSuccess = signal(false);
      readonly saveError = signal<string | null>(null);
      readonly generatedName = signal('');

      readonly compositionContext = signal<ProductCompositionContext | null>(null);

      private readonly attributesSignal = signal<ProductAttributeOption[]>([]);
      private readonly categoriesSignal = signal<NamedEntity[]>([]);
      private readonly manufacturersSignal = signal<NamedEntity[]>([]);
      private readonly suppliersSignal = signal<NamedEntity[]>([]);

      private readonly unitsSignal = signal<MaterialUnit[]>([]);
      private readonly catalogSignal = signal<MaterialCatalogItem[]>([]);

      readonly attributes = this.attributesSignal.asReadonly();
      readonly categories = this.categoriesSignal.asReadonly();
      readonly manufacturers = this.manufacturersSignal.asReadonly();
      readonly suppliers = this.suppliersSignal.asReadonly();
      readonly units = this.unitsSignal.asReadonly();
      readonly catalog = this.catalogSignal.asReadonly();

      readonly pendingAttribute = signal<ProductAttributeOption | null>(null);
      readonly pendingAttributeValue = signal('');
      readonly editingAttributeIndex = signal<number | null>(null);
      readonly attributeEditorError = signal<string | null>(null);

      initialize(): void {
            this.loadReferenceData();
            this.loadMaterialCatalog();
            this.initForm();
            this.addBarcode();
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

      get parentProductName(): string {
            return this.generatedName() || this.productForm.get('baseName')?.value || '';
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
            if (!id || isNaN(id)) return;

            this.productId.set(id);
            this.isEditMode.set(true);
            this.loadProductForEdit(id);
      }

      loadProductForEdit(id: number): void {
            this.isPageLoading.set(true);

            const detail$ = this.useSeedData
                  ? this.seed.getProductForEdit(id)
                  : this.api.getProductDetail(id);

            detail$.pipe(
                  tap(detail => {
                        if (detail) {
                              this.applyProductDetail(detail);
                        }
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
            this.materialsFormArray.controls.forEach(ctrl => ctrl.markAllAsTouched());

            if (this.productForm.invalid) {
                  if (this.materialsFormArray.invalid) {
                        this.saveError.set('يرجى تصحيح بيانات المواد قبل الحفظ');
                  } else {
                        this.saveError.set('يرجى تعبئة الحقول المطلوبة قبل الحفظ');
                  }
                  return null;
            }

            const payload = this.buildProductPayload();
            this.isSaving.set(true);
            this.saveError.set(null);
            this.saveSuccess.set(false);

            const save$ = this.useSeedData
                  ? this.seed.saveProduct(payload)
                  : this.api.saveProduct(payload);

            return save$.pipe(
                  tap(saved => {
                        this.isSaving.set(false);
                        this.saveSuccess.set(true);
                        console.log('Product aggregate payload:', saved);
                  }),
                  catchError(err => {
                        this.isSaving.set(false);
                        this.saveError.set(this.extractErrorMessage(err));
                        return throwError(() => err);
                  })
            );
      }

      buildProductPayload(): ProductManagePayload {
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
                  name: this.generatedName() || this.productForm.get('baseName')?.value,
                  baseName: this.productForm.get('baseName')?.value,
                  attributes: this.attributesFormArray.value,
                  barcodes: this.barcodesFormArray.value,
                  categoryId: this.productForm.get('categoryId')?.value,
                  manufacturerId: this.productForm.get('manufacturerId')?.value,
                  supplierIds: this.productForm.get('supplierIds')?.value,
                  materials,
                  composition: this.compositionContext() ?? undefined
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
            this.syncCompositionOwnerName(name);
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

      searchMaterials(query: string, excludeIds: number[] = [], showAllWhenEmpty = false): MaterialCatalogItem[] {
            const term = query.trim().toLowerCase();
            const available = this.catalog().filter(item => !excludeIds.includes(item.id));

            if (!term) {
                  return showAllWhenEmpty ? available : [];
            }

            return available.filter(
                  item => item.name.toLowerCase().includes(term) || item.barcode.includes(term)
            );
      }

      getMaterialById(id: number): MaterialCatalogItem | undefined {
            return this.catalog().find(m => m.id === id);
      }

      getUnitLabel(unitId: number): string {
            const unit = this.units().find(u => u.id === unitId);
            return unit ? unit.name : '—';
      }

      createMaterialFormGroup(data: Partial<ProductMaterialRow>): FormGroup {
            return this.fb.group({
                  materialId: [data.materialId ?? null, Validators.required],
                  materialName: [data.materialName ?? '', Validators.required],
                  parentProductId: [data.parentProductId ?? this.productId()],
                  parentProductName: [data.parentProductName ?? this.parentProductName],
                  quantity: [data.quantity ?? null, [Validators.required, positiveQuantityValidator()]],
                  unitId: [data.unitId ?? null, Validators.required],
                  costPerUnit: [data.costPerUnit ?? 0],
                  wastePercentage: [data.wastePercentage ?? null, [Validators.min(0), Validators.max(100)]],
                  notes: [data.notes ?? '']
              });
      }

      private initForm(): void {
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

      private loadReferenceData(): void {
            const data = this.seed.getReferenceData();
            this.attributesSignal.set([...data.attributes]);
            this.categoriesSignal.set([...data.categories]);
            this.manufacturersSignal.set([...data.manufacturers]);
            this.suppliersSignal.set([...data.suppliers]);
      }

      private loadMaterialCatalog(): void {
            this.unitsSignal.set(this.seed.getMaterialUnits());
            this.catalogSignal.set(this.seed.getMaterialCatalog());
      }

      private applyProductDetail(detail: ProductManageDetail): void {
            this.productForm.patchValue({
                  baseName: detail.baseName,
                  categoryId: detail.categoryId,
                  manufacturerId: detail.manufacturerId,
                  supplierIds: detail.supplierIds
            });

            this.attributesFormArray.clear();
            detail.attributes.forEach(attr => {
                  this.attributesFormArray.push(this.fb.group({
                        id: [attr.id],
                        name: [attr.name],
                        value: [attr.value]
                  }));
            });

            this.barcodesFormArray.clear();
            if (detail.barcodes.length) {
                  detail.barcodes.forEach(barcode => {
                        this.barcodesFormArray.push(this.fb.group({
                              barcode: [barcode.barcode],
                              sellingPrice: [barcode.sellingPrice],
                              buyingPrice: [barcode.buyingPrice],
                              stock: [barcode.stock],
                              isDefault: [barcode.isDefault]
                        }));
                  });
            } else if (this.barcodesFormArray.length === 0) {
                  this.addBarcode();
            }

            if (detail.composition) {
                  this.compositionContext.set(detail.composition);
            } else {
                  this.compositionContext.set({
                        ownerProductId: detail.id,
                        ownerProductName: detail.generatedName || detail.baseName
                  });
            }

            this.updateGeneratedName();
            this.loadMaterialsForEdit(detail.id);
      }

      private loadMaterialsForEdit(productId: number): void {
            const materials$ = this.useSeedData
                  ? this.seed.getProductMaterials(productId)
                  : this.api.getProductMaterials(productId);

            materials$.pipe(
                  tap(rows => {
                        this.materialsFormArray.clear();
                        rows.forEach(row => {
                              this.materialsFormArray.push(this.createMaterialFormGroup(row));
                        });
                        this.materialsFormArray.updateValueAndValidity();
                  }),
                  catchError(err => {
                        this.saveError.set(this.extractErrorMessage(err));
                        return throwError(() => err);
                  })
            ).subscribe();
      }

      private syncCompositionOwnerName(name: string): void {
            const ctx = this.compositionContext();
            if (!ctx) return;
            this.compositionContext.set({
                  ...ctx,
                  ownerProductName: name
            });
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
