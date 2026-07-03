import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ViewChild, ElementRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReceiptResponse, Product, CartItem } from '../../../core/models/pos.models';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

@Component({
      selector: 'app-cashier-receipt',
      standalone: true,
      imports: [CommonModule, ReactiveFormsModule],
      templateUrl: './cashier-receipt.component.html',
      styles: [`:host { display: contents; }`],
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashierReceiptComponent implements OnInit, OnDestroy {
      private fb = inject(FormBuilder);
      private destroy$ = new Subject<void>();

      @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

      @Input() items: CartItem[] = [];
      @Input() receipt: ReceiptResponse | null = null;
      @Input() finalTotal: number = 0;
      @Input() totalQuantity: number = 0;
      @Input() distinctItemsCount: number = 0;
      @Input() searchResults: Product[] = [];

      @Output() previousReceipt = new EventEmitter<void>();
      @Output() nextReceipt = new EventEmitter<void>();
      @Output() removeItem = new EventEmitter<number>();
      @Output() viewItem = new EventEmitter<any>();
      @Output() updateQuantity = new EventEmitter<{ item: CartItem, delta: number }>();
      @Output() addItem = new EventEmitter<{ product: Product, quantity: number }>();
      @Output() search = new EventEmitter<string>();

      inputForm!: FormGroup;
      selectedSearchIndex = -1;
      get today() { return new Date(); }

      ngOnInit() {
            this.inputForm = this.fb.group({
                  barcode: ['', Validators.required],
                  quantity: [1, [Validators.required, Validators.min(1)]],
                  price: [{ value: 0, disabled: true }]
            });

            this.inputForm.get('barcode')?.valueChanges.pipe(
                  takeUntil(this.destroy$),
                  debounceTime(150)
            ).subscribe(value => {
                  this.search.emit(typeof value === 'string' ? value : '');
                  this.selectedSearchIndex = -1;
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
            if (this.searchResults.length > 0 && this.selectedSearchIndex >= 0) {
                  this.onSelectProduct(this.searchResults[this.selectedSearchIndex]);
                  return;
            }
            // If not selected from dropdown but valid and search returns 1 exact match (handled in parent or here)
            if (this.searchResults.length === 1) {
                  this.onSelectProduct(this.searchResults[0]);
            }
      }

      onSearchKeyDown(event: KeyboardEvent) {
            if (this.searchResults.length === 0) return;
            if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  this.selectedSearchIndex = (this.selectedSearchIndex + 1) % this.searchResults.length;
            } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  this.selectedSearchIndex = (this.selectedSearchIndex - 1 + this.searchResults.length) % this.searchResults.length;
            } else if (event.key === 'Enter') {
                  event.preventDefault();
                  if (this.selectedSearchIndex >= 0) {
                        this.onSelectProduct(this.searchResults[this.selectedSearchIndex]);
                  } else if (this.searchResults.length === 1) {
                        this.onSelectProduct(this.searchResults[0]);
                  }
            }
      }

      onSelectProduct(product: Product) {
            const quantity = this.inputForm.get('quantity')?.value || 1;
            this.addItem.emit({ product, quantity });
            this.inputForm.patchValue({ barcode: '', quantity: 1, price: 0 });
            this.search.emit(''); // clear search
            setTimeout(() => this.searchInput?.nativeElement?.focus());
      }
}
