import { Component, ChangeDetectionStrategy, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ReceiptSidebarComponent } from './components/receipt-sidebar/receipt-sidebar.component';
import { ActionBarComponent } from './components/action-bar/action-bar.component';
import { ReceiptTableComponent } from './components/receipt-table/receipt-table.component';
import { ReceiptInputRowComponent } from './components/receipt-input-row/receipt-input-row.component';
import { TotalsBarComponent } from './components/totals-bar/totals-bar.component';
import { ReceiptInfoComponent } from './components/receipt-info/receipt-info.component';
import { ReceiptService } from '../core/services/receipt.service';

@Component({
  selector: 'app-cashier-page',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    ReceiptSidebarComponent,
    ActionBarComponent,
    ReceiptTableComponent,
    ReceiptInputRowComponent,
    TotalsBarComponent,
    ReceiptInfoComponent
  ],
  templateUrl: './cashier-page.component.html',
  styleUrls: ['./cashier-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashierPageComponent implements OnInit {
  private receiptService = inject(ReceiptService);

  sidebarVisible = signal(false);

  // Observable and Signal bindings
  currentReceipt = this.receiptService.currentReceipt;
  cartItems = this.receiptService.cartItems; // currently ReceiptItemInput[], might need mapping to full response for UI

  ngOnInit() {
    // Initialize or load any necessary state
  }

  // Action Bar Events
  onSave() {
    console.log('Save triggered');
    // Implement save logic via receiptService
  }

  onPrint() {
    console.log('Print triggered');
    // Implement print logic
  }

  onNew() {
    console.log('New triggered');
    this.receiptService.clearCart();
  }

  onEdit() {
    console.log('Edit triggered');
    // Implement edit logic
  }

  onDelete() {
    console.log('Delete triggered');
    // Implement delete logic
  }

  onToggleSidebar() {
    this.sidebarVisible.update(v => !v);
  }

  // Receipt Table Events
  onRemoveItem(productId: number) {
    this.receiptService.removeDraftItem(productId);
  }

  onViewItem(item: any) {
    console.log('View item', item);
  }

  onUpdateQuantity(event: {item: any, delta: number}) {
     // TODO: Implement actual update via service, currently the service adds quantity via addItemToDraftByBarcode
  }

  // Input Row Events
  onAddItem(item: {barcode: string, quantity: number, price?: number, discount?: number}) {
    this.receiptService.addItemToDraftByBarcode(item.barcode, item.quantity);
  }

  // Keyboard Shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    switch (event.key) {
      case 'F2':
        event.preventDefault();
        this.onSave();
        break;
      case 'F3':
        event.preventDefault();
        this.onNew();
        break;
      case 'F4':
        event.preventDefault();
        this.onEdit();
        break;
      case 'F5':
        event.preventDefault();
        this.onDelete();
        break;
      case 'F9':
        event.preventDefault();
        this.onPrint();
        break;
    }
  }
}
