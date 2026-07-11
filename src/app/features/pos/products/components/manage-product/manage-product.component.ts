import {
      Component,
      OnInit,
      OnDestroy,
      inject,
      signal,
      ViewChild,
      ElementRef,
      ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../../../../shared/components/sidebar/sidebar.component';
import { ProductManageStateService } from '../../services/product-manage-state.service';
import { ProductMaterialsTabComponent } from '../product-materials-tab/product-materials-tab.component';
import { ProductReplenishmentTabComponent } from '../product-replenishment-tab/product-replenishment-tab.component';
import { FloatingDropdownComponent } from '../../../../../shared/components/floating-dropdown/floating-dropdown.component';
import type { NamedEntity, ProductAttributeOption } from '../../models/product.models';
import { calculateProfitMargin } from '../../models/product.models';

@Component({
      selector: 'app-manage-product',
      standalone: true,
      imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, SidebarComponent, ProductMaterialsTabComponent, ProductReplenishmentTabComponent, FloatingDropdownComponent],
      templateUrl: './manage-product.component.html',
      styleUrl: './manage-product.component.css',
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageProductComponent implements OnInit, OnDestroy {
      private readonly state = inject(ProductManageStateService);
      private readonly router = inject(Router);
      private readonly route = inject(ActivatedRoute);
      private readonly destroy$ = new Subject<void>();

      activeTab: 'basic' | 'materials' | 'replenishment' = 'basic';
      replenishmentItemsCount = 0;
      sidebarVisible = signal(false);
      activeDropdown: 'attribute' | 'category' | 'manufacturer' | 'supplier' | null = null;
      showOverlay: 'category' | 'manufacturer' | 'supplier' | 'attribute' | null = null;

      @ViewChild('attributeTrigger') attributeTrigger?: ElementRef<HTMLButtonElement>;

      productId = this.state.productId;
      isEditMode = this.state.isEditMode;
      isPageLoading = this.state.isPageLoading;
      isSaving = this.state.isSaving;
      saveSuccess = this.state.saveSuccess;
      saveError = this.state.saveError;
      generatedName = this.state.generatedName;

      readonly attributes = this.state.attributes;
      readonly categories = this.state.categories;
      readonly manufacturers = this.state.manufacturers;
      readonly suppliers = this.state.suppliers;

      readonly pendingAttribute = this.state.pendingAttribute;
      readonly editingAttributeIndex = this.state.editingAttributeIndex;
      readonly attributeEditorError = this.state.attributeEditorError;

      readonly calculateProfitMargin = calculateProfitMargin;

      get productForm() {
            return this.state.productForm;
      }

      get materialsFormArray() {
            return this.state.materialsFormArray;
      }

      get attributesFormArray() {
            return this.state.attributesFormArray;
      }

      get barcodesFormArray() {
            return this.state.barcodesFormArray;
      }

      get isBaseNameInvalid(): boolean {
            return this.state.isBaseNameInvalid;
      }

      get pageTitle(): string {
            return this.state.pageTitle;
      }

      get parentProductName(): string {
            return this.state.parentProductName;
      }

      get pendingAttributeLabel(): string {
            return this.state.pendingAttributeLabel;
      }

      get canConfirmAttribute(): boolean {
            return this.state.canConfirmAttribute;
      }

      get selectedCategoryName(): string {
            return this.state.getSelectedCategoryName();
      }

      get selectedManufacturerName(): string {
            return this.state.getSelectedManufacturerName();
      }

      get selectedSuppliers(): NamedEntity[] {
            return this.state.getSelectedSuppliers();
      }

      ngOnInit(): void {
            this.state.initialize();
            this.state.productForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
                  this.state.onFormValueChanged();
            });
            this.resolveEditMode();
      }

      ngOnDestroy(): void {
            this.destroy$.next();
            this.destroy$.complete();
      }

      private resolveEditMode(): void {
            const idParam = this.route.snapshot.paramMap.get('id');
            if (!idParam) return;
            const id = Number(idParam);
            if (isNaN(id)) return;
            this.state.resolveEditMode(id);
      }

      onToggleSidebar(): void {
            this.sidebarVisible.update(v => !v);
      }

      onSearchAttributeValueChange(value: string): void {
            this.state.pendingAttributeValue.set(value);
      }

      get pendingAttributeValue(): string {
            return this.state.pendingAttributeValue();
      }

      set pendingAttributeValue(value: string) {
            this.state.pendingAttributeValue.set(value);
      }

      selectPendingAttribute(attr: ProductAttributeOption, event?: MouseEvent): void {
            if (event) {
                  event.preventDefault();
                  event.stopPropagation();
            }
            this.state.selectPendingAttribute(attr);
            this.activeDropdown = null;
      }

      confirmAttributeValue(): void {
            this.state.confirmAttributeValue();
      }

      loadAttributeForEdit(index: number): void {
            this.state.loadAttributeForEdit(index);
      }

      removeAttribute(index: number): void {
            this.state.removeAttribute(index);
      }

      addBarcode(): void {
            this.state.addBarcode();
      }

      removeBarcode(index: number): void {
            this.state.removeBarcode(index);
      }

      setDefaultBarcode(index: number): void {
            this.state.setDefaultBarcode(index);
      }

      getTotalStock(): number {
            return this.state.getTotalStock();
      }

      getStockClass(): string {
            return this.state.getStockClass();
      }

      getStockLabel(): string {
            return this.state.getStockLabel();
      }

      toggleDropdown(type: 'attribute' | 'category' | 'manufacturer' | 'supplier'): void {
            this.activeDropdown = this.activeDropdown === type ? null : type;
      }

      closeDropdowns(): void {
            this.activeDropdown = null;
      }

      onFormBodyScroll(): void {
            if (this.activeDropdown) {
                  this.activeDropdown = null;
            }
      }

      selectCategory(cat: NamedEntity): void {
            this.state.selectCategory(cat);
            this.activeDropdown = null;
      }

      selectManufacturer(man: NamedEntity): void {
            this.state.selectManufacturer(man);
            this.activeDropdown = null;
      }

      toggleSupplier(sup: NamedEntity): void {
            this.state.toggleSupplier(sup);
      }

      isSupplierSelected(sup: NamedEntity): boolean {
            return this.state.isSupplierSelected(sup);
      }

      removeSupplier(id: number): void {
            this.state.removeSupplier(id);
      }

      getAvailableAttributesForDropdown(): ProductAttributeOption[] {
            return this.state.getAvailableAttributesForDropdown();
      }

      openOverlay(type: 'category' | 'manufacturer' | 'supplier' | 'attribute'): void {
            this.showOverlay = type;
            this.activeDropdown = null;
      }

      closeOverlay(): void {
            this.showOverlay = null;
      }

      addNewItem(type: 'category' | 'manufacturer' | 'supplier' | 'attribute', name: string): void {
            this.state.addNewReferenceItem(type, name);
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

      onSave(): void {
            const result = this.state.saveProduct();
            if (!result) {
                  if (this.state.saveError() && this.materialsFormArray.invalid) {
                        this.activeTab = 'materials';
                  }
                  return;
            }
            result.subscribe();
      }
}
