import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
  ViewChild, ViewChildren, QueryList, ElementRef, OnInit, OnDestroy, inject, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReceiptResponse, Product, CartItem, ReceiptMode } from '../../../core/models/pos.models';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { ProductSearchPopupComponent } from '../../../../../shared/components/product-search-popup/product-search-popup.component';
import { ProductSearchService } from '../../../../../shared/services/product-search.service';

@Component({
      selector: 'app-cashier-receipt',
      standalone: true,
      imports: [CommonModule, ReactiveFormsModule, ProductSearchPopupComponent],
      templateUrl: './cashier-receipt.component.html',
      styles: [`:host { display: contents; }`],
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashierReceiptComponent implements OnInit, OnDestroy {
      private fb = inject(FormBuilder);
      private cdr = inject(ChangeDetectorRef);
      private productSearch = inject(ProductSearchService);
      private destroy$ = new Subject<void>();

      @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
      @ViewChildren('rowQtyInput') rowQtyInputs!: QueryList<ElementRef<HTMLInputElement>>;

      @Input() items: CartItem[] = [];
      @Input() receipt: ReceiptResponse | null = null;
      @Input() receiptMode: ReceiptMode = 'NEW';
      @Input() finalTotal: number = 0;
      @Input() totalQuantity: number = 0;
      @Input() distinctItemsCount: number = 0;
      @Input() products: Product[] = [];

      @Output() previousReceipt = new EventEmitter<void>();
      @Output() nextReceipt = new EventEmitter<void>();
      @Output() removeItem = new EventEmitter<number>();
      @Output() viewItem = new EventEmitter<any>();
      @Output() updateQuantity = new EventEmitter<{ item: CartItem, delta: number }>();
      @Output() addItem = new EventEmitter<{ product: Product, quantity: number }>();

      inputForm!: FormGroup;
      popupOpen = false;
      popupInitialQuery = '';
      private lastAddedProductId: number | null = null;

      get today() { return new Date(); }
      get searchTriggerEl(): HTMLElement | undefined {
            return this.searchInput?.nativeElement;
      }

      ngOnInit() {
            this.inputForm = this.fb.group({
                  barcode: ['', Validators.required],
                  quantity: [1, [Validators.required, Validators.min(1)]],
                  price: [{ value: 0, disabled: true }]
            });

            this.inputForm.get('barcode')?.valueChanges.pipe(
                  takeUntil(this.destroy$),
                  debounceTime(80)
            ).subscribe(value => {
                  this.evaluateSearchInput(typeof value === 'string' ? value : '');
            });
      }

      ngOnDestroy() {
            this.destroy$.next();
            this.destroy$.complete();
      }

      incrementQty() {
            const qty = this.inputForm.get('quantity')?.value || 1;
            this.inputForm.get('quantity')?.setValue(qty + 1);
      }

      decrementQty() {
            const qty = this.inputForm.get('quantity')?.value || 1;
            if (qty > 1) {
                  this.inputForm.get('quantity')?.setValue(qty - 1);
            }
      }

      submitInputRow() {
            const term = (this.inputForm.get('barcode')?.value || '').trim();
            if (!term) return;

            const exact = this.productSearch.findExactByCode(this.products, term);
            if (exact) {
                  this.onSelectProduct(exact);
                  return;
            }

            const matches = this.productSearch.filterProducts(this.products, { query: term });
            if (matches.length === 1) {
                  this.onSelectProduct(matches[0]);
                  return;
            }

            if (matches.length > 1) {
                  this.openProductPopup(term);
            }
      }

      onSearchDoubleClick(event: MouseEvent): void {
            event.preventDefault();
            const term = (this.inputForm.get('barcode')?.value || '').trim();
            this.openProductPopup(term);
      }

      onSearchKeyDown(event: KeyboardEvent) {
            if (this.popupOpen) return;

            if (event.key === 'Enter') {
                  event.preventDefault();
                  this.submitInputRow();
            }
      }

      onPopupProductSelected(product: Product): void {
            this.onSelectProduct(product);
      }

      onPopupClosed(): void {
            this.popupOpen = false;
            this.cdr.markForCheck();
            setTimeout(() => this.searchInput?.nativeElement?.focus());
      }

      onSelectProduct(product: Product) {
            const quantity = this.inputForm.get('quantity')?.value || 1;
            this.lastAddedProductId = product.id;
            this.addItem.emit({ product, quantity });
            this.inputForm.patchValue({ barcode: '', quantity: 1, price: 0 });
            this.popupOpen = false;
            this.cdr.markForCheck();

            setTimeout(() => this.focusAddedRowQuantity(), 80);
      }

      onInlineQuantityChange(item: CartItem, event: Event) {
            const input = event.target as HTMLInputElement;
            const newQty = parseInt(input.value, 10);
            if (!isNaN(newQty) && newQty > 0) {
                  const delta = newQty - item.quantity;
                  if (delta !== 0) {
                        this.updateQuantity.emit({ item, delta });
                  }
            } else {
                  input.value = String(item.quantity);
            }
      }

      onInlineQuantityEnter(item: CartItem, event: Event) {
            this.onInlineQuantityChange(item, event);
            this.focusBarcodeScanner();
      }

      focusBarcodeScanner() {
            setTimeout(() => this.searchInput?.nativeElement?.focus());
      }

      trackByProductId(index: number, item: CartItem): number {
            return item.productId;
      }

      private evaluateSearchInput(term: string): void {
            if (!term) {
                  this.popupOpen = false;
                  this.cdr.markForCheck();
                  return;
            }

            if (this.productSearch.findExactByCode(this.products, term)) {
                  this.popupOpen = false;
                  this.cdr.markForCheck();
                  return;
            }

            const matches = this.productSearch.filterProducts(this.products, { query: term });
            if (matches.length > 0) {
                  this.popupInitialQuery = term;
                  this.popupOpen = true;
            } else {
                  this.popupOpen = false;
            }
            this.cdr.markForCheck();
      }

      private openProductPopup(query: string): void {
            this.popupInitialQuery = query;
            this.popupOpen = true;
            this.cdr.markForCheck();
      }

      private focusAddedRowQuantity(): void {
            const targetId = this.lastAddedProductId;
            if (targetId != null && this.rowQtyInputs) {
                  const inputs = this.rowQtyInputs.toArray();
                  const targetInput = inputs.find(
                        input => input.nativeElement.getAttribute('data-product-id') === String(targetId)
                  );
                  if (targetInput) {
                        targetInput.nativeElement.focus();
                        targetInput.nativeElement.select();
                        return;
                  }
            }
            this.focusBarcodeScanner();
      }
}
