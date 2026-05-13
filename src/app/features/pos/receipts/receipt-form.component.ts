import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptService } from '../core/services/receipt.service';
import type { CreateReceiptInput, PaymentMethod } from '../core/models/pos.models';

@Component({
  selector: 'app-receipt-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="receipt-form-container card p-md">
      <div class="header flex justify-between items-center mb-md border-b pb-sm">
        <h2>{{ isEditing ? 'تعديل فاتورة: ' + (receiptService.currentReceipt()?.receiptNumber) : 'إنشاء فاتورة جديدة' }}</h2>
        <button class="btn btn-outline" (click)="clearForm()">إفراغ الفاتورة / جديد</button>
      </div>

      <div *ngIf="receiptService.error$ | async as error" class="alert alert-danger mb-md">
        {{ error }}
      </div>

      <!-- Settings Row -->
      <div class="form-grid mb-md">
        <div>
          <label>طريقة الدفع</label>
          <select class="input w-full" [(ngModel)]="localPaymentMethod">
            <option value="CASH">نقدي</option>
            <option value="TRANSFER">تحويل بنكي</option>
          </select>
        </div>
        <div>
          <label>خصم إضافي (على الفاتورة)</label>
          <input type="number" class="input w-full" [(ngModel)]="localDiscount" placeholder="0" />
        </div>
        <div>
           <label>الضريبة (٪)</label>
           <input type="number" class="input w-full" [(ngModel)]="localTax" placeholder="0" />
        </div>
      </div>

      <!-- Product Barcode Search Entry -->
      <div class="add-item-row mb-md p-sm bg-light border-radius">
        <label>إضافة صنف (الباركود): </label>
        <div class="flex gap-sm">
           <input 
             #barcodeInput
             type="text" 
             [(ngModel)]="newItemBarcode" 
             (keyup.enter)="addItem()"
             class="input flex-1" 
             placeholder="امسح الباركود هنا..." 
             autofocus
           />
           <button class="btn btn-primary" (click)="addItem()">إضافة</button>
        </div>
      </div>

      <!-- Draft Items Table -->
      <table class="table w-full mb-md">
        <thead>
          <tr>
            <th>معرف الصنف (ID)</th>
            <th>الكمية</th>
            <th>خصم الصنف</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of receiptService.cartItems()">
            <td>{{ item.productId }}</td>
            <td>
               <input type="number" class="input text-center w-20" [(ngModel)]="item.quantity" min="1"/>
            </td>
            <td>
               <input type="number" class="input text-center w-20" [(ngModel)]="item.discount" min="0"/>
            </td>
            <td>
              <button class="btn btn-sm btn-danger" (click)="removeItem(item.productId)">حذف</button>
            </td>
          </tr>
          
          <tr *ngIf="receiptService.cartItems().length === 0">
            <td colspan="4" class="text-center p-md text-light">لم يتم إضافة أصناف بعد. ابدأ بمسح الباركود.</td>
          </tr>
        </tbody>
      </table>

      <!-- Totals Preview / API Output -->
      <div class="totals-area p-md bg-light border-radius mt-md" *ngIf="receiptService.currentReceipt() as finalReceipt">
         <h4 class="mb-sm text-primary">تم حفظ الفاتورة بنجاح</h4>
         <div class="flex justify-between font-bold">
           <span>الإجمالي الفرعي: {{ finalReceipt.subtotal }}</span>
           <span>الخصم: {{ finalReceipt.discount }}</span>
           <span>الضريبة: {{ finalReceipt.tax }}</span>
           <span class="text-primary text-lg">النهائي: {{ finalReceipt.finalTotal }}</span>
         </div>
      </div>

      <!-- Submit Actions -->
      <div class="actions flex gap-sm mt-md justify-end">
        <button 
          class="btn btn-primary text-lg px-lg" 
          [disabled]="(receiptService.loading$ | async) || receiptService.cartItems().length === 0"
          (click)="saveReceipt()">
          {{ (receiptService.loading$ | async) ? 'جاري الحفظ...' : (isEditing ? 'تحديث الفاتورة' : 'إنشاء وحفظ') }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .receipt-form-container { padding: 20px; }
    .bg-light { background: #f8fafc; }
    .border-radius { border-radius: 8px; }
    .border-b { border-bottom: 1px solid #e2e8f0; }
    .p-md { padding: 16px; }
    .p-sm { padding: 8px; }
    .mb-md { margin-bottom: 16px; }
    .mb-sm { margin-bottom: 8px; }
    .mt-md { margin-top: 16px; }
    .pb-sm { padding-bottom: 8px; }
    .w-full { width: 100%; }
    .w-20 { width: 80px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 10px; border-bottom: 1px solid #ddd; text-align: right; }
    .btn { padding: 8px 16px; border-radius: 4px; cursor: pointer; border: none; font-weight: bold; }
    .btn-sm { font-size: 12px; padding: 4px 8px; }
    .btn-primary { background: #0f172a; color: white; }
    .btn-outline { border: 1px solid #cbd5e1; background: white; }
    .btn-danger { background: #fee2e2; color: #b91c1c; border: none; }
    .alert-danger { background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 4px; }
    .text-primary { color: #0ea5e9; }
    .text-lg { font-size: 18px; }
    .px-lg { padding-left: 24px; padding-right: 24px; }
  `]
})
export class ReceiptFormComponent implements OnInit {
  receiptService = inject(ReceiptService);
  @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;

  newItemBarcode: string = '';
  
  // Local Form state
  localPaymentMethod: PaymentMethod = 'CASH';
  localDiscount: number = 0;
  localTax: number = 0;
  
  // Assuming a cashierId exists from Auth/Login
  // Hardcoded for demo/example purposes.
  currentCashierId = 1; 

  get isEditing(): boolean {
    return !!this.receiptService.currentReceipt();
  }

  ngOnInit() {
    // If it's loaded with an existing receipt (from the list redirect)
    // we would prepopulate these form fields:
    const existing = this.receiptService.currentReceipt();
    if (existing) {
      this.localPaymentMethod = existing.paymentMethod;
      this.localDiscount = existing.discount || 0;
      this.localTax = existing.tax || 0;
    }
  }

  async addItem() {
    if (!this.newItemBarcode.trim()) return;
    
    // We await the addition which uses IPC to fetch product info and push to draft array
    await this.receiptService.addItemToDraftByBarcode(this.newItemBarcode.trim(), 1);
    
    this.newItemBarcode = '';
    setTimeout(() => {
       if (this.barcodeInput) this.barcodeInput.nativeElement.focus();
    }, 100);
  }

  removeItem(productId: number) {
    this.receiptService.removeDraftItem(productId);
  }

  saveReceipt() {
    const draftItems = this.receiptService.cartItems();
    if (draftItems.length === 0) return;
    
    const receiptData = this.receiptService.currentReceipt();

    const payload: CreateReceiptInput = {
      customerName: receiptData?.customerName || receiptData?.customer?.name || 'Walk-in Customer',
      customerId: null,
      cashierId: this.currentCashierId,
      paymentMethod: this.localPaymentMethod,
      receiptType: 'SELL',
      totalQuantity: draftItems.reduce((acc, item) => acc + item.quantity, 0),
      discount: this.localDiscount,
      tax: this.localTax,
      items: draftItems.map(i => ({
        productCode: i.product.barcode || '',
        price: i.price,
        quantity: i.quantity,
        total: i.total,
        remainingStock: i.remainingStock
      }))
    };

    if (this.isEditing) {
      const existingId = this.receiptService.currentReceipt()!.id;
      this.receiptService.updateReceipt(existingId, payload).subscribe({
         next: () => console.log('Update Successful')
      });
    } else {
      this.receiptService.createReceipt(payload).subscribe({
         next: () => {
            console.log('Create Successful');
            // The service clears the cart on successful create.
         }
      });
    }
  }

  clearForm() {
    this.receiptService.clearCart();
    this.localDiscount = 0;
    this.localTax = 0;
    this.localPaymentMethod = 'CASH';
  }
}
