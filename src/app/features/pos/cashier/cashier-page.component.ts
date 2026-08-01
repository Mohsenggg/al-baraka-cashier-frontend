import { Component, ChangeDetectionStrategy, inject, HostListener, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// New dumb components
import { CashierActionsComponent } from './components/cashier-actions/cashier-actions.component';
import { CashierSidebarComponent } from './components/cashier-sidebar/cashier-sidebar.component';
import { CashierReceiptComponent } from './components/cashier-receipt/cashier-receipt.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

// New state service
import { CashierStateService } from './services/cashier-state.service';
import { CreateReceiptInput, Product, CartItem, PaymentMethod } from '../core/models/pos.models';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
      selector: 'app-cashier-page',
      standalone: true,
      imports: [
            CommonModule,
            FormsModule,
            CashierActionsComponent,
            CashierSidebarComponent,
            CashierReceiptComponent,
            SidebarComponent
      ],
      templateUrl: './cashier-page.component.html',
      styleUrls: ['./cashier-page.component.css'],
      encapsulation: ViewEncapsulation.None, // Ensures composed CSS targets dumb component internals perfectly
      changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashierPageComponent implements OnInit {
      private state = inject(CashierStateService);
      private notifications = inject(NotificationService);

      sidebarVisible = signal(false);
      rightSidebarVisible = signal(false);

      // State bindings
      receipts$ = this.state.receipts$;
      filteredReceipts$ = this.state.filteredReceipts$;
      loading$ = this.state.loading$;

      currentReceipt = this.state.currentReceipt;
      cartItems = this.state.cartItems;
      distinctItemsCount = this.state.distinctItemsCount;
      totalQuantity = this.state.totalQuantity;
      subtotal = this.state.subtotal;
      totalDiscount = this.state.totalDiscount;
      tax = this.state.tax;
      finalTotal = this.state.finalTotal;
      receiptMode = this.state.receiptMode;
      hasStockErrors = this.state.hasStockErrors;
      products = this.state.products;

      showPaymentScreen = signal(false);

      ngOnInit() {
            this.state.loadAllProducts().subscribe();
            // Initial fetch to populate sidebar
            this.state.filterReceipts({ page: 0, size: 20 });
      }

      // Action Bar Events
      onSave() {
            const items = this.cartItems();
            if (items.length === 0) return;
            if (this.hasStockErrors()) return;
            
            if (!this.showPaymentScreen()) {
                  this.showPaymentScreen.set(true);
                  return;
            }

            const receiptData = this.currentReceipt();

            const isEdit = this.receiptMode() === 'EDIT';
            const payload: CreateReceiptInput = {
                  customerName: receiptData?.customerName || receiptData?.customer?.name || 'Walk-in Customer',
                  customerPhone: receiptData?.customerPhone || receiptData?.customer?.phone || '',
                  customerId: receiptData?.customerId || null,
                  cashierId: receiptData?.cashierId || 1,
                  paymentMethod: receiptData?.paymentMethod || 'CASH',
                  receiptType: 'SELL',
                  totalQuantity: this.totalQuantity(),
                  items: items.map(item => ({
                        productCode: item.product.barcode,
                        productName: item.product.name,
                        sellingPrice: item.sellingPrice,
                        buyingPrice: item.buyingPrice,
                        quantity: item.quantity,
                        total: item.total,
                        remainingStock: item.remainingStock,
                        ...(isEdit && item.originalQuantity != null ? { originalQuantity: item.originalQuantity } : {})
                  }))
            };

            if (this.receiptMode() === 'EDIT' && receiptData?.id) {
                  this.state.updateReceipt(receiptData.id, payload).subscribe(() => {
                        this.showPaymentScreen.set(false);
                        this.state.filterReceipts({ page: 0, size: 20 }); // refresh list
                  });
            } else {
                  this.state.createReceipt(payload).subscribe(() => {
                        this.showPaymentScreen.set(false);
                        this.state.filterReceipts({ page: 0, size: 20 }); // refresh list
                  });
            }
      }

      onSaveAndPrint() {
            this.onSave();
            this.onPrint();
      }

      onPrint() {
            console.log('Print triggered - Printing implementation will be added later.');
      }

      onNew() {
            this.state.clearCart();
      }

      onEdit() {
            this.state.setReceiptMode('EDIT');
      }
      onDelete() {
            const receipt = this.currentReceipt();
            if (!receipt?.id) {
                  this.notifications.warning('لا توجد فاتورة محددة للحذف');
                  return;
            }
            if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم استرجاع رصيد الأصناف إلى المخزون.')) return;

            this.state.deleteReceipt(receipt.id).subscribe({
                  next: () => {
                        this.notifications.success('تم حذف الفاتورة واسترجاع المخزون بنجاح');
                        this.state.filterReceipts({ page: 0, size: 20 });
                  },
                  error: (err) => {
                        const message = err?.error?.message || 'فشل حذف الفاتورة';
                        this.notifications.error(message);
                  }
            });
      }
      onReturn() { }
      onDrafts() { }

      onToggleSidebar() {
            this.sidebarVisible.update(v => !v);
      }

      onToggleRightSidebar() {
            this.rightSidebarVisible.update(v => !v);
      }

      // Receipt Table Events
      onRemoveItem(productId: number) {
            this.state.removeDraftItem(productId);
      }

      onViewItem(item: any) {
            console.log('View item', item);
      }

      onUpdateQuantity(event: { item: CartItem, delta: number }) {
            if (event.delta > 0) {
                  this.onAddItem({ product: event.item.product, quantity: event.delta });
            } else {
                  this.state.updateItemQuantity(event.item.productId, event.delta);
            }
      }

      onUpdateItemField(event: { item: CartItem, field: 'sellingPrice' | 'quantity' | 'total', value: number }) {
            if (event.field === 'quantity') {
                  const delta = event.value - event.item.quantity;
                  if (delta > 0) {
                        this.onAddItem({ product: event.item.product, quantity: delta });
                        return;
                  }
            }
            this.state.updateCartItemField(event.item.productId, event.field, event.value);
      }

      // Refill state
      showRefillDialog = signal(false);
      showPricingDialog = signal(false);
      refillProduct: Product | null = null;
      /** How many units of the PARENT product to transfer */
      refillParentUnits: number = 1;
      refillSelectedParentId: number | null = null;
      isRefillLoading = signal(false);
      pricingValidation: import('../core/models/pos.models').RefillValidateResponse | null = null;
      /**
       * The quantity the cashier originally tried to sell (e.g. 1 piece).
       * Preserved across the refill dialog so the cart row reflects the sale,
       * not the inventory refill amount.
       */
      refillOriginalSaleQuantity: number = 1;

      /** The conversion option currently selected */
      get selectedRefillOption() {
            return this.refillProduct?.refillOptions?.find(o => o.parentProductId === this.refillSelectedParentId) ?? null;
      }

      /** Units that will be added to the child product */
      get refillChildUnitsAdded(): number {
            const opt = this.selectedRefillOption;
            if (!opt || opt.parentQuantity === 0) return 0;
            return Math.floor(this.refillParentUnits * (opt.childQuantity / opt.parentQuantity));
      }

      /**
       * How many child units are still missing to fulfil the original sale quantity.
       * e.g. stock=9, requested=20 → shortage = 11
       */
      get refillMissingChildQty(): number {
            if (!this.refillProduct) return 0;
            const currentStock = this.refillProduct.stockQuantity ?? 0;
            const totalNeeded = (this.cartItems().find(i => i.productId === this.refillProduct!.id)?.quantity ?? 0)
                  + this.refillOriginalSaleQuantity;
            return Math.max(0, totalNeeded - currentStock);
      }

      /** Remaining parent stock after the transfer */
      get refillParentRemainingAfter(): number {
            const opt = this.selectedRefillOption;
            if (!opt) return 0;
            return (opt.parentStock ?? 0) - this.refillParentUnits;
      }

      /** Max parent units the cashier can transfer (limited by available parent stock) */
      get refillParentMaxUnits(): number {
            const opt = this.selectedRefillOption;
            return opt ? (opt.parentStock ?? 0) : 0;
      }

      onRefillParentSelect(parentId: number) {
            this.refillSelectedParentId = parentId;
            // Reset to 1 when switching parent
            this.refillParentUnits = 1;
      }

      async onAddItem(event: { product: Product, quantity: number }) {
            const currentItem = this.cartItems().find(i => i.productId === event.product.id);
            const totalRequested = (currentItem?.quantity || 0) + event.quantity;

            if (event.product.stockQuantity < totalRequested) {
                  const options = event.product.refillOptions;

                  if (options && options.length > 0) {
                        // How many child units are still missing after current stock
                        const missingChildQty = totalRequested - event.product.stockQuantity;

                        this.refillProduct = event.product;
                        this.refillOriginalSaleQuantity = event.quantity;

                        // Choose the default parent (or first option)
                        const preferredParent = options.find(o => o.isDefault) ?? options[0];

                        // Check if the preferred parent can cover the shortage
                        // If not, find another parent that can (with the most stock)
                        const capableParent = options
                              .filter(o => o.parentStock > 0)
                              .sort((a, b) => b.parentStock - a.parentStock)
                              .find(o => {
                                    // max child units this parent can provide
                                    const maxChild = o.parentStock * (o.childQuantity / o.parentQuantity);
                                    return maxChild >= missingChildQty;
                              });

                        const selectedParent = capableParent ?? preferredParent;
                        this.refillSelectedParentId = selectedParent.parentProductId;

                        // Pre-fill stepper with the MINIMUM parent units needed to cover the shortage
                        const ratio = selectedParent.childQuantity / selectedParent.parentQuantity;
                        const minParentUnits = ratio > 0
                              ? Math.ceil(missingChildQty / ratio)
                              : 1;

                        this.refillParentUnits = Math.max(1, Math.min(minParentUnits, selectedParent.parentStock));

                        this.showRefillDialog.set(true);
                        return;
                  } else {
                        // Show insufficient stock message as a toast, and allow it to be added to cart with error state
                        this.notifications.warning(`الكمية المطلوبة (${totalRequested}) تتجاوز الرصيد المتاح (${event.product.stockQuantity})`);
                  }
            }
            this.state.addCartItem(event.product, event.quantity);
      }

      async confirmRefill() {
            const childQty = this.refillChildUnitsAdded;
            if (!this.refillProduct || !this.refillSelectedParentId || childQty < 1) return;
            
            this.isRefillLoading.set(true);
            try {
                  const response = await this.state.validateRefill({
                        childBarcode: this.refillProduct.barcode,
                        parentProductId: this.refillSelectedParentId,
                        requestedChildQuantity: childQty
                  });
                  
                  this.pricingValidation = response;
                  if (response.pricingChangeRequired) {
                        this.showRefillDialog.set(false);
                        this.showPricingDialog.set(true);
                  } else {
                        await this.executeRefill(false);
                  }
            } catch (err: any) {
                  this.notifications.error(err?.error?.message || 'فشل التحقق من إعادة التعبئة');
            } finally {
                  this.isRefillLoading.set(false);
            }
      }

      async executeRefill(acceptPricingChange: boolean = true) {
            const childQty = this.refillChildUnitsAdded;
            if (!this.refillProduct || !this.refillSelectedParentId || !this.pricingValidation) return;
            
            this.isRefillLoading.set(true);
            try {
                  const updatedProduct = await this.state.executeRefill({
                        childBarcode: this.refillProduct.barcode,
                        parentProductId: this.refillSelectedParentId,
                        requestedChildQuantity: childQty,
                        acceptPricingChange: acceptPricingChange,
                        expectedNewBuyingPrice: this.pricingValidation.newBuyingPrice,
                        expectedProposedSellingPrice: this.pricingValidation.proposedSellingPrice,
                        expectedMarkupPercentage: this.pricingValidation.currentMarkupPercentage,
                        parentUnitsUsed: this.refillParentUnits
                  });
                  
                  this.showPricingDialog.set(false);
                  this.showRefillDialog.set(false);
                  
                  // Add the originally requested SALE quantity to the cart.
                  // refillChildUnitsAdded is an inventory operation and must never
                  // replace the cashier's requested sale quantity.
                  this.state.addCartItem(updatedProduct, this.refillOriginalSaleQuantity);
                  this.refillProduct = null;
                  this.pricingValidation = null;
                  this.refillOriginalSaleQuantity = 1;
                  this.notifications.success('تمت إعادة التعبئة بنجاح');
            } catch (err: any) {
                  this.notifications.error(err?.error?.message || 'فشل تنفيذ إعادة التعبئة');
            } finally {
                  this.isRefillLoading.set(false);
            }
      }

      cancelRefill() {
            this.showRefillDialog.set(false);
            this.showPricingDialog.set(false);
            this.refillProduct = null;
            this.pricingValidation = null;
      }

      onUpdatePaymentMethod(method: PaymentMethod) {
            this.state.updateDraftReceiptData({ paymentMethod: method });
      }

      onUpdateCustomerName(name: string) {
            this.state.updateDraftReceiptData({ customerName: name });
      }

      onUpdateCustomerPhone(phone: string) {
            const current = this.currentReceipt();
            const customer = { ...(current?.customer || {}), phone } as any;
            this.state.updateDraftReceiptData({ customer });
      }

      // Sidebar Events
      onSelectReceipt(id: number) {
            this.state.loadNavigationCache(id);
      }

      onApplyFilters(filters: any) {
            this.state.filterReceipts({ ...filters, page: 0, size: 20 });
      }

      onClearFilters() {
            this.state.filterReceipts({ sort: 'receiptDate,DESC', page: 0, size: 20 });
      }

      onPreviousReceipt() {
            this.state.navigateReceipt('PREVIOUS');
      }

      onNextReceipt() {
            this.state.navigateReceipt('NEXT');
      }

      @HostListener('window:keydown', ['$event'])
      handleKeyboardEvent(event: KeyboardEvent) {
            switch (event.key) {
                  case 'F1': event.preventDefault(); this.onNew(); break;
                  case 'F2': event.preventDefault(); this.onEdit(); break;
                  case 'F8': event.preventDefault(); this.onReturn(); break;
                  case 'F11': event.preventDefault(); this.onSave(); break;
                  case 'F12': event.preventDefault(); this.onSaveAndPrint(); break;
                  case 'F5': event.preventDefault(); this.onDelete(); break;
            }
      }
}
