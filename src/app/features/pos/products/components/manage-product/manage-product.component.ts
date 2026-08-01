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
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { SidebarComponent } from '../../../../../shared/components/sidebar/sidebar.component';
import { ProductManageStateService } from '../../services/product-manage-state.service';
import { FloatingDropdownComponent } from '../../../../../shared/components/floating-dropdown/floating-dropdown.component';
import { ProductSearchPopupComponent } from '../../../../../shared/components/product-search-popup/product-search-popup.component';
import type { NamedEntity, ProductAttributeOption, ProductListItemDto } from '../../models/product.models';
import { calculateProfitMargin } from '../../models/product.models';
import { ProductApiService } from '../../services/product-api.service';

@Component({
      selector: 'app-manage-product',
      standalone: true,
      imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, SidebarComponent, FloatingDropdownComponent, ProductSearchPopupComponent],
      templateUrl: './manage-product.component.html',
      styleUrl: './manage-product.component.css',
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageProductComponent implements OnInit, OnDestroy {
      private readonly state = inject(ProductManageStateService);
      private readonly api = inject(ProductApiService);
      private readonly router = inject(Router);
      private readonly route = inject(ActivatedRoute);
      private readonly destroy$ = new Subject<void>();

      activeTab: 'basic' | 'conversions' | 'composition' = 'basic';
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

      // Product search state for composition/conversions
      allProducts = signal<any[]>([]);
      popupOpen = signal(false);
      activeSearchContext = signal<{ type: 'composition' | 'conversion', index: number } | null>(null);

      get productForm() {
            return this.state.productForm;
      }

      get compositionFormArray() {
            return this.state.compositionFormArray;
      }

      get conversionsFormArray() {
            return this.state.conversionsFormArray;
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
            if (!idParam) {
                  this.state.resolveEditMode(null);
                  return;
            }
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

      addConversion(): void {
            this.state.addConversion();
      }

      removeConversion(index: number): void {
            this.state.removeConversion(index);
      }

      setDefaultConversion(index: number): void {
            this.state.setDefaultConversion(index);
      }

      addCompositionRow(): void {
            this.state.addCompositionRow();
      }

      removeCompositionRow(index: number): void {
            this.state.removeCompositionRow(index);
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
                  this.closeDropdowns();
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

      openProductPopup(type: 'composition' | 'conversion', index: number): void {
            this.activeSearchContext.set({ type, index });
            this.popupOpen.set(true);

            if (this.allProducts().length === 0) {
                  this.api.listProducts({ size: 1000 }).subscribe(res => {
                        const mapped = res.content.map(p => ({
                              ...p,
                              barcode: p.code,
                              stockQuantity: p.stock
                        }));
                        this.allProducts.set(mapped);
                  });
            }
      }

      onPopupClosed(): void {
            this.popupOpen.set(false);
            this.activeSearchContext.set(null);
      }

      selectProductFromSearch(product: any): void {
            const context = this.activeSearchContext();
            if (!context) return;
            const { type, index } = context;

            if (type === 'composition') {
                  const ctrl = this.compositionFormArray.at(index);
                  ctrl.patchValue({
                        materialId: product.id,
                        materialName: product.name,
                        costPerUnit: product.sellingPrice
                  });
            } else if (type === 'conversion') {
                  const ctrl = this.conversionsFormArray.at(index);
                  ctrl.patchValue({
                        parentProductId: product.id,
                        parentProductName: product.name
                  });
            }

            this.onPopupClosed();
      }

      onCancel(): void {
            this.router.navigate(['/pos/products']);
      }

      onSave(): void {
            const result = this.state.saveProduct();
            if (!result) {
                  if (this.state.saveError()) {
                        if (this.productForm.get('composition')?.invalid && this.productForm.get('hasComposition')?.value) {
                              this.activeTab = 'composition';
                        } else if (this.productForm.get('conversions')?.invalid && this.productForm.get('hasConversion')?.value) {
                              this.activeTab = 'conversions';
                        } else {
                              this.activeTab = 'basic';
                        }
                  }
                  return;
            }
            result.subscribe();
      }
}
