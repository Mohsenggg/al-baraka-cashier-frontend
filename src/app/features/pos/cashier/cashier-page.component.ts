import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashierPageComponentsComponent } from './cashier-page-components/cashier-page-components.component';
import { ReceiptService } from '../core/services/receipt.service';

@Component({
  selector: 'app-cashier-page',
  standalone: true,
  imports: [
    CommonModule,
    CashierPageComponentsComponent
  ],
  templateUrl: './cashier-page.component.html',
  styleUrls: ['./cashier-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CashierPageComponent implements OnInit {
  private receiptService = inject(ReceiptService);

  sidebarVisible = signal(false);
  rightSidebarVisible = signal(false);

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

  onSaveAndPrint() {
    console.log('Save and Print triggered');
    // Implement save and print logic
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

  onReturn() {
    console.log('Return triggered');
    // Implement return logic
  }

  onDrafts() {
    console.log('Drafts triggered');
    // Implement drafts view
  }

  onToggleSidebar() {
    this.sidebarVisible.update(v => !v);
  }

  onToggleRightSidebar() {
    this.rightSidebarVisible.update(v => !v);
  }

  // Receipt Table Events
  onRemoveItem(productId: number) {
    this.receiptService.removeDraftItem(productId);
  }

  onViewItem(item: any) {
    console.log('View item', item);
  }

  onUpdateQuantity(event: any) {
    console.log('Update quantity', event);
    // Implement quantity update logic
  }

  onAddItem(event: any) {
    console.log('Add item', event);
    // Implement add item logic
  }
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
      case 'F1':
        event.preventDefault();
        this.onNew();
        break;
      case 'F2':
        event.preventDefault();
        this.onEdit();
        break;
      case 'F8':
        event.preventDefault();
        this.onReturn();
        break;
      case 'F11':
        event.preventDefault();
        this.onSave();
        break;
      case 'F12':
        event.preventDefault();
        this.onSaveAndPrint();
        break;
      case 'F5': // keeping delete as F5 as it was before, or user can specify
        event.preventDefault();
        this.onDelete();
        break;
    }
  }
}
