import { Component, ChangeDetectionStrategy, inject, HostListener, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

// New dumb components
import { CashierActionsComponent } from './components/cashier-actions/cashier-actions.component';
import { CashierSidebarComponent } from './components/cashier-sidebar/cashier-sidebar.component';
import { CashierReceiptComponent } from './components/cashier-receipt/cashier-receipt.component';
import { SidebarComponent } from '../../../../shared/components/sidebar/sidebar.component';

// New state service
import { CashierStateService } from '../services/cashier-state.service';
import { CreateReceiptInput, Product, CartItem } from '../../core/models/pos.models';

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

  sidebarVisible = signal(false);
  rightSidebarVisible = signal(false);
  searchResults = signal<Product[]>([]);

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

  ngOnInit() {
    this.state.loadAllProducts();
    // Initial fetch to populate sidebar
    this.state.filterReceipts({ page: 0, size: 20 });
  }

  // Action Bar Events
  onSave() {
    const items = this.cartItems();
    if (items.length === 0) return;
    const receiptData = this.currentReceipt();

    const payload: CreateReceiptInput = {
      customerName: receiptData?.customerName || receiptData?.customer?.name || 'Walk-in Customer',
      customerId: receiptData?.customerId || null,
      cashierId: receiptData?.cashierId || 1,
      paymentMethod: receiptData?.paymentMethod || 'CASH',
      receiptType: 'SELL',
      totalQuantity: this.totalQuantity(),
      items: items.map(item => ({
        productCode: item.product.barcode,
        productName: item.product.name,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
        remainingStock: item.remainingStock
      }))
    };
    
    this.state.createReceipt(payload).subscribe(() => {
      this.state.filterReceipts({ page: 0, size: 20 }); // refresh list
    });
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

  onEdit() {}
  onDelete() {}
  onReturn() {}
  onDrafts() {}

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

  onUpdateQuantity(event: {item: CartItem, delta: number}) {
    this.state.updateItemQuantity(event.item.productId, event.delta);
  }

  onAddItem(event: { product: Product, quantity: number }) {
    this.state.addCartItem(event.product, event.quantity);
  }

  onSearch(query: string) {
    if (!query) {
      this.searchResults.set([]);
      return;
    }
    const results = this.state.searchProducts(query);
    this.searchResults.set(results);
  }

  // Sidebar Events
  onSelectReceipt(id: number) {
    this.state.getReceipt(id);
  }

  onApplyFilters(filters: any) {
    this.state.filterReceipts({ ...filters, page: 0, size: 20 });
  }

  onClearFilters() {
    this.state.filterReceipts({ sort: 'receiptDate,DESC', page: 0, size: 20 });
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
