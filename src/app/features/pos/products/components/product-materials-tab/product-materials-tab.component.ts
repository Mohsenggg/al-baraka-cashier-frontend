import { Component, Input, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl
} from '@angular/forms';
import { ProductMaterialCatalogService } from '../../services/product-material-catalog.service';
import {
  MaterialCatalogItem,
  ProductMaterialRow
} from '../../models/product-material.models';
import { positiveQuantityValidator } from '../../validators/product-material.validators';

@Component({
  selector: 'app-product-materials-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product-materials-tab.component.html',
  styleUrl: './product-materials-tab.component.css'
})
export class ProductMaterialsTabComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalog = inject(ProductMaterialCatalogService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) materialsFormArray!: FormArray;
  @Input() parentProductId: number | null = null;
  @Input() parentProductName = '';
  @Input() loading = false;

  materialSearchQuery = '';
  showSearchResults = signal(false);
  showAllMaterials = signal(false);

  showMaterialDialog = signal(false);
  editingMaterialIndex: number | null = null;
  materialDialogForm!: FormGroup;

  showDeleteConfirm = signal(false);
  deleteTargetIndex: number | null = null;

  readonly units = this.catalog.units;

  ngOnInit(): void {
    this.initMaterialDialogForm();
  }

  get searchResults(): MaterialCatalogItem[] {
    const addedIds = this.materialsFormArray.controls.map(
      c => c.get('materialId')?.value as number
    );
    return this.catalog.searchMaterials(
      this.materialSearchQuery,
      addedIds,
      this.showAllMaterials()
    );
  }

  get totalMaterialCost(): number {
    return this.materialsFormArray.controls.reduce((sum, ctrl) => {
      return sum + this.getRowTotalCost(ctrl as FormGroup);
    }, 0);
  }

  get hasDuplicateMaterials(): boolean {
    return this.materialsFormArray.hasError('duplicateMaterial');
  }

  onSearchInput(): void {
    this.showAllMaterials.set(false);
    this.showSearchResults.set(this.materialSearchQuery.trim().length > 0 || this.showAllMaterials());
  }

  onSearchFocus(): void {
    if (this.materialSearchQuery.trim() || this.showAllMaterials()) {
      this.showSearchResults.set(true);
    }
  }

  closeSearchResults(): void {
    this.showSearchResults.set(false);
    this.showAllMaterials.set(false);
  }

  selectMaterialFromSearch(item: MaterialCatalogItem): void {
    this.materialSearchQuery = '';
    this.showSearchResults.set(false);
    this.openAddDialog(item);
  }

  openAddDialog(item: MaterialCatalogItem): void {
    this.editingMaterialIndex = null;
    this.materialDialogForm.reset({
      materialId: item.id,
      materialName: item.name,
      parentProductId: this.parentProductId,
      parentProductName: this.parentProductName,
      quantity: null,
      unitId: item.defaultUnitId,
      costPerUnit: item.costPerUnit,
      wastePercentage: null,
      notes: ''
    });
    this.showMaterialDialog.set(true);
  }

  openEditDialog(index: number): void {
    const row = this.materialsFormArray.at(index) as FormGroup;
    this.editingMaterialIndex = index;
    this.materialDialogForm.patchValue(row.getRawValue());
    this.showMaterialDialog.set(true);
  }

  openAddMaterialManually(): void {
    this.materialSearchQuery = '';
    this.showAllMaterials.set(true);
    this.showSearchResults.set(true);
  }

  closeMaterialDialog(): void {
    this.showMaterialDialog.set(false);
    this.editingMaterialIndex = null;
  }

  confirmMaterialDialog(): void {
    this.materialDialogForm.markAllAsTouched();
    if (this.materialDialogForm.invalid) return;

    const value = this.materialDialogForm.getRawValue();
    const materialId = value.materialId as number;

    const isDuplicate = this.materialsFormArray.controls.some((ctrl, i) => {
      if (this.editingMaterialIndex !== null && i === this.editingMaterialIndex) return false;
      return ctrl.get('materialId')?.value === materialId;
    });

    if (isDuplicate) {
      this.materialDialogForm.setErrors({ duplicateMaterial: true });
      return;
    }

    const normalized = {
      ...value,
      quantity: value.quantity != null ? Number(value.quantity) : null,
      costPerUnit: Number(value.costPerUnit) || 0,
      wastePercentage: value.wastePercentage != null && value.wastePercentage !== ''
        ? Number(value.wastePercentage) : null
    };

    if (this.editingMaterialIndex !== null) {
      (this.materialsFormArray.at(this.editingMaterialIndex) as FormGroup).patchValue(normalized);
    } else {
      this.materialsFormArray.push(this.createMaterialGroup(normalized));
    }

    this.materialsFormArray.markAsDirty();
    this.materialsFormArray.updateValueAndValidity();
    this.cdr.markForCheck();
    this.closeMaterialDialog();
  }

  requestRemoveMaterial(index: number): void {
    this.deleteTargetIndex = index;
    this.showDeleteConfirm.set(true);
  }

  confirmRemoveMaterial(): void {
    if (this.deleteTargetIndex !== null) {
      this.materialsFormArray.removeAt(this.deleteTargetIndex);
      this.materialsFormArray.markAsDirty();
      this.materialsFormArray.updateValueAndValidity();
      this.cdr.markForCheck();
    }
    this.cancelRemoveMaterial();
  }

  cancelRemoveMaterial(): void {
    this.showDeleteConfirm.set(false);
    this.deleteTargetIndex = null;
  }

  getRowTotalCost(group: FormGroup): number {
    const qty = Number(group.get('quantity')?.value) || 0;
    const cost = Number(group.get('costPerUnit')?.value) || 0;
    return qty * cost;
  }

  getRowGroup(index: number): FormGroup {
    return this.materialsFormArray.at(index) as FormGroup;
  }

  asFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  trackByIndex(index: number): number {
    return index;
  }

  isQuantityInvalid(index: number): boolean {
    const ctrl = this.getRowGroup(index).get('quantity');
    return !!(ctrl?.invalid && ctrl.touched);
  }

  getQuantityError(index: number): string {
    const ctrl = this.getRowGroup(index).get('quantity');
    if (!ctrl?.errors) return '';
    if (ctrl.errors['quantityRequired']) return 'الكمية مطلوبة';
    if (ctrl.errors['quantityInvalid']) return 'يجب أن تكون الكمية أكبر من صفر';
    return 'قيمة غير صالحة';
  }

  getUnitLabel(unitId: number): string {
    return this.catalog.getUnitLabel(unitId);
  }

  getDeleteTargetName(): string {
    if (this.deleteTargetIndex === null) return '';
    return this.getRowGroup(this.deleteTargetIndex).get('materialName')?.value || '';
  }

  getDialogMaterialName(): string {
    return this.materialDialogForm?.get('materialName')?.value || 'مادة';
  }

  isDialogDuplicate(): boolean {
    return !!this.materialDialogForm?.hasError('duplicateMaterial');
  }

  static createMaterialGroup(fb: FormBuilder, data: Partial<ProductMaterialRow>): FormGroup {
    return fb.group({
      materialId: [data.materialId ?? null, Validators.required],
      materialName: [data.materialName ?? '', Validators.required],
      parentProductId: [data.parentProductId ?? null],
      parentProductName: [data.parentProductName ?? ''],
      quantity: [data.quantity ?? null, [Validators.required, positiveQuantityValidator()]],
      unitId: [data.unitId ?? null, Validators.required],
      costPerUnit: [data.costPerUnit ?? 0],
      wastePercentage: [data.wastePercentage ?? null, [Validators.min(0), Validators.max(100)]],
      notes: [data.notes ?? '']
    });
  }

  private initMaterialDialogForm(): void {
    this.materialDialogForm = ProductMaterialsTabComponent.createMaterialGroup(this.fb, {});
  }

  private createMaterialGroup(data: Partial<ProductMaterialRow>): FormGroup {
    return ProductMaterialsTabComponent.createMaterialGroup(this.fb, data);
  }
}
