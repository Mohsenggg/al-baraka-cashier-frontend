import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ReceiptService } from '../core/services/receipt.service';

@Component({
  selector: 'app-receipt-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="receipt-list-container card">
      <div class="header-actions flex justify-between items-center mb-md">
        <h2>إدارة الفواتير</h2>
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (ngModelChange)="onSearchChange($event)"
            placeholder="بحث برقم الفاتورة..."
            class="input"
          />
        </div>
      </div>

      <div *ngIf="receiptService.error$ | async as error" class="alert alert-danger mb-md">
        {{ error }}
      </div>

      <div *ngIf="receiptService.loading$ | async" class="loading-spinner">
        جاري التحميل...
      </div>

      <table class="table w-full">
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>العميل</th>
            <th>الكاشير</th>
            <th>التاريخ</th>
            <th>طريقة الدفع</th>
            <th>الإجمالي</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let receipt of receiptService.receipts$ | async; trackBy: trackById">
            <td>{{ receipt.receiptNumber }}</td>
            <td>{{ receipt.customer?.name || '---' }}</td>
            <td>{{ receipt.cashier?.name || '---' }}</td>
            <td>{{ receipt.createdAt | date:'short' }}</td>
            <td>{{ receipt.paymentMethod === 'CASH' ? 'نقدي' : 'تحويل' }}</td>
            <td class="font-bold text-primary">{{ receipt.finalTotal }}</td>
            <td class="actions gap-sm flex">
              <button class="btn btn-sm btn-outline" (click)="viewReceipt(receipt.id)">عـرض / تعـديل</button>
              <button class="btn btn-sm btn-danger" (click)="deleteReceipt(receipt.id)">حـذف</button>
            </td>
          </tr>
          
          <tr *ngIf="(receiptService.receipts$ | async)?.length === 0">
            <td colspan="7" class="text-center p-md text-light">لا توجد فواتير مطابقة للبحث</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination Controls Example -->
      <div class="pagination flex justify-between mt-md items-center" *ngIf="(receiptService.pagination$ | async) as pag">
         <span>صفحة {{ pag.page }} من {{ pag.totalPages }} (إجمالي {{ pag.total }})</span>
         <div class="flex gap-sm">
           <button class="btn btn-outline" [disabled]="pag.page <= 1" (click)="loadPage(pag.page - 1)">السابق</button>
           <button class="btn btn-outline" [disabled]="pag.page >= pag.totalPages" (click)="loadPage(pag.page + 1)">التالي</button>
         </div>
      </div>
    </div>
  `,
  styles: [`
    .receipt-list-container { padding: 20px; }
    .mb-md { margin-bottom: 16px; }
    .mt-md { margin-top: 16px; }
    .p-md { padding: 16px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 10px; border-bottom: 1px solid #ddd; text-align: right; }
    .btn { padding: 6px 12px; border-radius: 4px; cursor: pointer; }
    .btn-sm { font-size: 12px; }
    .btn-outline { border: 1px solid #ccc; background: white; }
    .btn-danger { background: #fee2e2; color: #b91c1c; border: none; }
    .alert-danger { background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 4px; }
    .loading-spinner { color: #888; font-style: italic; }
  `]
})
export class ReceiptListComponent implements OnInit {
  receiptService = inject(ReceiptService);
  
  searchTerm = '';
  searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Initial Load
    this.receiptService.loadReceipts();

    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.receiptService.loadReceipts(1, 10, term);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(term: string) {
    this.searchSubject.next(term);
  }

  loadPage(page: number) {
    this.receiptService.loadReceipts(page, 10, this.searchTerm);
  }

  viewReceipt(id: number) {
    // Navigate to form component or show modal
    console.log('Navigate to Edit/View Receipt', id);
  }

  deleteReceipt(id: number) {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟ (سيتم استرجاع رصيد الأصناف)')) {
      this.receiptService.deleteReceipt(id).subscribe({
         next: () => {
             // Optional: reload the current page directly after successful deletion
             this.receiptService.loadReceipts(1, 10, this.searchTerm);
         }
      });
    }
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}
