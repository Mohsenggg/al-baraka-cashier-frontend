import { Component, ChangeDetectionStrategy, inject, HostListener, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

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
            this.state.updateItemQuantity(event.item.productId, event.delta);
      }

      onUpdateItemField(event: { item: CartItem, field: 'sellingPrice' | 'quantity' | 'total', value: number }) {
            this.state.updateCartItemField(event.item.productId, event.field, event.value);
      }

      onAddItem(event: { product: Product, quantity: number }) {
            this.state.addCartItem(event.product, event.quantity);
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
