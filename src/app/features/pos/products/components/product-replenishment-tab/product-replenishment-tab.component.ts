import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  signal,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormArray,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { positiveQuantityValidator } from '../../validators/product-material.validators';

/** UI-only mock catalog entry — replace with API catalog on backend integration. */
interface ReplenishmentSourceProduct {
  id: number;
  name: string;
  barcode: string;
}

/** Temporary mock products for product selection (no backend). */
const MOCK_REPLENISHMENT_PRODUCTS: ReplenishmentSourceProduct[] = [
  { id: 1, name: 'صندوق', barcode: '6281002001001' },
  { id: 2, name: 'عجين', barcode: '6281002002001' },
  { id: 3, name: 'جبنة', barcode: '6281002003001' },
  { id: 4, name: 'صلصة', barcode: '6281002004001' },
  { id: 5, name: 'صابون سائل', barcode: '6281001001001' },
  { id: 6, name: 'كلور سائل', barcode: '6281001004001' },
  { id: 7, name: 'منظف أرضيات', barcode: '6281001005001' },
  { id: 8, name: 'شامبو', barcode: '6281001006001' }
];

function duplicateSourceProductValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) return null;

    const ids = control.controls
      .map(c => c.get('sourceProductId')?.value)
      .filter((id): id is number => id != null);

    return new Set(ids).size !== ids.length ? { duplicateSourceProduct: true } : null;
  };
}

@Component({
  selector: 'app-product-replenishment-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product-replenishment-tab.component.html',
  styleUrl: './product-replenishment-tab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductReplenishmentTabComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() currentProductId: number | null = null;
  @Input() currentProductName = '';
  @Input() loading = false;

  @Output() itemsCountChange = new EventEmitter<number>();

  readonly itemsFormArray: FormArray = this.fb.array([], [duplicateSourceProductValidator()]);

  productSearchQuery = '';
  showSearchResults = signal(false);
  showAllProducts = signal(false);

  showItemDialog = signal(false);
  editingItemIndex: number | null = null;
  itemDialogForm!: FormGroup;

  showDeleteConfirm = signal(false);
  deleteTargetIndex: number | null = null;

  ngOnInit(): void {
    this.initItemDialogForm();
    this.emitItemsCount();
  }

  get searchResults(): ReplenishmentSourceProduct[] {
    return this.searchProducts(
      this.productSearchQuery,
      this.getExcludedProductIds(),
      this.showAllProducts()
    );
  }

  get hasDuplicateSourceProducts(): boolean {
    return this.itemsFormArray.hasError('duplicateSourceProduct');
  }

  onSearchInput(): void {
    this.showAllProducts.set(false);
    this.showSearchResults.set(this.productSearchQuery.trim().length > 0 || this.showAllProducts());
  }

  onSearchFocus(): void {
    if (this.productSearchQuery.trim() || this.showAllProducts()) {
      this.showSearchResults.set(true);
    }
  }

  closeSearchResults(): void {
    this.showSearchResults.set(false);
    this.showAllProducts.set(false);
  }

  selectProductFromSearch(item: ReplenishmentSourceProduct): void {
    this.productSearchQuery = '';
    this.showSearchResults.set(false);
    this.openAddDialog(item);
  }

  openAddDialog(item: ReplenishmentSourceProduct): void {
    this.editingItemIndex = null;
    this.itemDialogForm.reset({
      sourceProductId: item.id,
      sourceProductName: item.name,
      quantity: null
    });
    this.showItemDialog.set(true);
  }

  openEditDialog(index: number): void {
    const row = this.itemsFormArray.at(index) as FormGroup;
    this.editingItemIndex = index;
    this.itemDialogForm.patchValue(row.getRawValue());
    this.showItemDialog.set(true);
  }

  openAddItemManually(): void {
    this.productSearchQuery = '';
    this.showAllProducts.set(true);
    this.showSearchResults.set(true);
  }

  closeItemDialog(): void {
    this.showItemDialog.set(false);
    this.editingItemIndex = null;
    this.itemDialogForm.setErrors(null);
  }

  confirmItemDialog(): void {
    this.itemDialogForm.markAllAsTouched();
    if (this.itemDialogForm.invalid) return;

    const value = this.itemDialogForm.getRawValue();
    const sourceProductId = value.sourceProductId as number;

    if (this.isCurrentProduct(sourceProductId)) {
      this.itemDialogForm.setErrors({ selfReference: true });
      return;
    }

    const isDuplicate = this.itemsFormArray.controls.some((ctrl, i) => {
      if (this.editingItemIndex !== null && i === this.editingItemIndex) return false;
      return ctrl.get('sourceProductId')?.value === sourceProductId;
    });

    if (isDuplicate) {
      this.itemDialogForm.setErrors({ duplicateSourceProduct: true });
      return;
    }

    const normalized = {
      sourceProductId,
      sourceProductName: value.sourceProductName as string,
      quantity: Number(value.quantity)
    };

    if (this.editingItemIndex !== null) {
      (this.itemsFormArray.at(this.editingItemIndex) as FormGroup).patchValue(normalized);
    } else {
      this.itemsFormArray.push(this.createItemFormGroup(normalized));
    }

    this.itemsFormArray.markAsDirty();
    this.itemsFormArray.updateValueAndValidity();
    this.emitItemsCount();
    this.cdr.markForCheck();
    this.closeItemDialog();
  }

  requestRemoveItem(index: number): void {
    this.deleteTargetIndex = index;
    this.showDeleteConfirm.set(true);
  }

  confirmRemoveItem(): void {
    if (this.deleteTargetIndex !== null) {
      this.itemsFormArray.removeAt(this.deleteTargetIndex);
      this.itemsFormArray.markAsDirty();
      this.itemsFormArray.updateValueAndValidity();
      this.emitItemsCount();
      this.cdr.markForCheck();
    }
    this.cancelRemoveItem();
  }

  cancelRemoveItem(): void {
    this.showDeleteConfirm.set(false);
    this.deleteTargetIndex = null;
  }

  getRowGroup(index: number): FormGroup {
    return this.itemsFormArray.at(index) as FormGroup;
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

  getDeleteTargetName(): string {
    if (this.deleteTargetIndex === null) return '';
    return this.getRowGroup(this.deleteTargetIndex).get('sourceProductName')?.value || '';
  }

  isDialogDuplicate(): boolean {
    return !!this.itemDialogForm?.hasError('duplicateSourceProduct');
  }

  isDialogSelfReference(): boolean {
    return !!this.itemDialogForm?.hasError('selfReference');
  }

  isDialogSourceRequired(): boolean {
    const ctrl = this.itemDialogForm?.get('sourceProductId');
    return !!(ctrl?.invalid && ctrl.touched);
  }

  /** Placeholder for future backend load — returns configured rows for save payload. */
  getReplenishmentItemsForSave(): { sourceProductId: number; quantity: number }[] {
    return this.itemsFormArray.controls.map(ctrl => ({
      sourceProductId: ctrl.get('sourceProductId')?.value as number,
      quantity: Number(ctrl.get('quantity')?.value)
    }));
  }

  private initItemDialogForm(): void {
    this.itemDialogForm = this.createItemFormGroup({});
  }

  private createItemFormGroup(data: Partial<{ sourceProductId: number; sourceProductName: string; quantity: number }>): FormGroup {
    return this.fb.group({
      sourceProductId: [data.sourceProductId ?? null, Validators.required],
      sourceProductName: [data.sourceProductName ?? ''],
      quantity: [data.quantity ?? null, [Validators.required, positiveQuantityValidator()]]
    });
  }

  private searchProducts(
    query: string,
    excludeIds: number[],
    showAllWhenEmpty: boolean
  ): ReplenishmentSourceProduct[] {
    const q = query.trim().toLowerCase();
    const excluded = new Set(excludeIds);

    return MOCK_REPLENISHMENT_PRODUCTS.filter(item => {
      if (excluded.has(item.id)) return false;
      if (this.isCurrentProduct(item.id)) return false;
      if (!q && !showAllWhenEmpty) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.barcode.includes(q);
    });
  }

  private getExcludedProductIds(): number[] {
    return this.itemsFormArray.controls.map(
      c => c.get('sourceProductId')?.value as number
    );
  }

  private isCurrentProduct(productId: number): boolean {
    return this.currentProductId != null && productId === this.currentProductId;
  }

  private emitItemsCount(): void {
    this.itemsCountChange.emit(this.itemsFormArray.length);
  }
}
