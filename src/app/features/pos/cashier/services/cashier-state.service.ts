import { Injectable, computed, signal, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { CashierApiService } from './cashier-api.service';
import { CashierSeedService } from './cashier-seed.service';
import type {
  ReceiptResponse, CreateReceiptInput, UpdateReceiptInput,
  Product, CartItem, ReceiptFilterParams, ReceiptListItemDto
} from '../../core/models/pos.models';

@Injectable({
  providedIn: 'root'
})
export class CashierStateService {
  private api = inject(CashierApiService);
  private seed = inject(CashierSeedService);

  // --------- State Management (RxJS BehaviorSubjects) ---------
  private _receiptsList = new BehaviorSubject<ReceiptResponse[]>([]);
  public receipts$ = this._receiptsList.asObservable();

  private _filteredReceipts = new BehaviorSubject<ReceiptListItemDto[]>([]);
  public filteredReceipts$ = this._filteredReceipts.asObservable();

  private _loading = new BehaviorSubject<boolean>(false);
  public loading$ = this._loading.asObservable();

  private _error = new BehaviorSubject<string | null>(null);
  public error$ = this._error.asObservable();

  private _pagination = new BehaviorSubject<{ page: number; size: number; total: number; totalPages: number }>({
    page: 1, size: 10, total: 0, totalPages: 0
  });
  public pagination$ = this._pagination.asObservable();

  // --------- Frontend POS Cart State (Signal based for UI reactivity) ---------
  private draftItemsSignal = signal<CartItem[]>([]);
  public cartItems = this.draftItemsSignal.asReadonly();

  public distinctItemsCount = computed(() => this.draftItemsSignal().length);
  public totalQuantity = computed(() => this.draftItemsSignal().reduce((acc, item) => acc + item.quantity, 0));
  public subtotal = computed(() => this.draftItemsSignal().reduce((acc, item) => acc + item.total, 0));
  public totalDiscount = computed(() => this.draftItemsSignal().reduce((acc, item) => acc + item.discount, 0));
  public tax = computed(() => this.subtotal() * 0.15); // Example 15% tax
  public finalTotal = computed(() => this.subtotal() + this.tax());

  private currentSavedReceiptSignal = signal<ReceiptResponse | null>(null);
  public currentReceipt = this.currentSavedReceiptSignal.asReadonly();

  // Signal to hold all cached products locally
  private productsSignal = signal<Product[]>([]);
  public products = this.productsSignal.asReadonly();

  constructor() { }

  // --------- API Orchestration Methods ---------

  public loadAllProducts(): void {
    this.setLoading(true);
    this.api.getAllProducts().subscribe({
      next: (dtoList) => {
        // Map DTOs to products, leveraging seed service for missing data
        const mappedProducts = dtoList.map(dto => this.seed.getPlaceholderProduct({
          id: dto.id,
          name: dto.name,
          barcode: dto.code,
          sellingPrice: dto.price,
          stockQuantity: dto.stock
        }));
        this.productsSignal.set(mappedProducts);
        this.clearError();
      },
      error: (err) => this.handleError(err),
      complete: () => this.setLoading(false)
    });
  }

  public searchProducts(query: string): Product[] {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const all = this.productsSignal();
    return all.filter(p => 
      p.barcode.toLowerCase().includes(term) || 
      p.name.toLowerCase().includes(term)
    );
  }

  public loadReceipts(page: number = 1, size: number = 10, search: string = ''): void {
    this.setLoading(true);
    this.api.getReceipts(page, size, search).subscribe({
      next: (res) => {
        const content = res.data || res.content || [];
        this._receiptsList.next(content);
        this._pagination.next({
          page: res.page,
          size: res.size,
          total: res.total || res.totalElements || 0,
          totalPages: res.totalPages || Math.ceil((res.total || 0) / res.size)
        });
        this.clearError();
      },
      error: (err) => this.handleError(err),
      complete: () => this.setLoading(false)
    });
  }

  public filterReceipts(params: ReceiptFilterParams): void {
    this.setLoading(true);
    this.api.filterReceipts(params).subscribe({
      next: (res) => {
        this._filteredReceipts.next(res.content || []);
        this._pagination.next({
          page: (res.number || 0) + 1,
          size: res.size || 20,
          total: res.totalElements || 0,
          totalPages: res.totalPages || 0
        });
        this.clearError();
      },
      error: (err) => this.handleError(err),
      complete: () => this.setLoading(false)
    });
  }

  public getReceipt(id: number): void {
    this.setLoading(true);
    this.api.getReceiptById(id).subscribe({
      next: (receipt) => {
        this.currentSavedReceiptSignal.set(receipt);
        this.draftItemsSignal.set(
          receipt.items.map(i => ({
            productId: 0, 
            productName: i.productName,
            quantity: i.quantity,
            price: i.unitPrice,
            discount: 0,
            total: i.totalPrice,
            remainingStock: i.remainingStock,
            product: this.seed.getPlaceholderProduct({
              name: i.productName,
              barcode: i.productCode,
              sellingPrice: i.unitPrice,
              stockQuantity: i.remainingStock + i.quantity
            })
          }))
        );
        this.clearError();
      },
      error: (err) => this.handleError(err),
      complete: () => this.setLoading(false)
    });
  }

  public createReceipt(payload: CreateReceiptInput): Observable<ReceiptResponse> {
    this.setLoading(true);
    const req = this.api.createReceipt(payload);
    req.subscribe({
      next: (receipt) => {
        this.currentSavedReceiptSignal.set(receipt);
        this.clearCart();
        this.clearError();
      },
      error: (err) => this.handleError(err),
      complete: () => this.setLoading(false)
    });
    return req;
  }

  public updateReceipt(id: number, payload: UpdateReceiptInput): Observable<ReceiptResponse> {
    this.setLoading(true);
    const req = this.api.updateReceipt(id, payload);
    req.subscribe({
      next: (receipt) => {
        this.currentSavedReceiptSignal.set(receipt);
        this.clearError();
      },
      error: (err) => this.handleError(err),
      complete: () => this.setLoading(false)
    });
    return req;
  }

  public deleteReceipt(id: number): void {
    this.setLoading(true);
    this.api.deleteReceipt(id).subscribe({
      next: () => {
        this.clearError();
        const currentList = this._receiptsList.value;
        this._receiptsList.next(currentList.filter(r => r.id !== id));
      },
      error: (err) => this.handleError(err),
      complete: () => this.setLoading(false)
    });
  }

  // --------- Cart Logic Methods ---------

  public addCartItem(product: Product, quantity: number = 1) {
    const items = [...this.draftItemsSignal()];
    const existingIdx = items.findIndex(i => i.productId === product.id);

    if (existingIdx > -1) {
      items[existingIdx].quantity += quantity;
      items[existingIdx].total = items[existingIdx].quantity * items[existingIdx].price;
      items[existingIdx].remainingStock = product.stockQuantity - items[existingIdx].quantity;
    } else {
      items.push({
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.sellingPrice,
        discount: 0,
        total: product.sellingPrice * quantity,
        remainingStock: product.stockQuantity - quantity,
        product
      });
    }
    this.draftItemsSignal.set(items);
  }

  public removeDraftItem(productId: number) {
    this.draftItemsSignal.update(items => items.filter(i => i.productId !== productId));
  }

  public clearCart() {
    this.draftItemsSignal.set([]);
    this.currentSavedReceiptSignal.set(null);
  }

  public updateItemQuantity(productId: number, delta: number) {
    const items = [...this.draftItemsSignal()];
    const existingIdx = items.findIndex(i => i.productId === productId);

    if (existingIdx > -1) {
      const newQty = items[existingIdx].quantity + delta;
      if (newQty > 0) {
        items[existingIdx].quantity = newQty;
        items[existingIdx].total = items[existingIdx].quantity * items[existingIdx].price;
        items[existingIdx].remainingStock = items[existingIdx].product.stockQuantity - newQty;
      } else {
        items.splice(existingIdx, 1);
      }
      this.draftItemsSignal.set(items);
    }
  }

  // --------- Internal Helper Methods ---------

  private setLoading(isLoading: boolean) {
    this._loading.next(isLoading);
  }

  private handleError(err: any) {
    let errorMsg = 'حدث خطأ أثناء معالجة الطلب';
    if (err.error && err.error.message) {
      errorMsg = err.error.message;
    } else if (err.message) {
      errorMsg = err.message;
    }
    this._error.next(errorMsg);
    console.error('Backend Error:', err);
  }

  public clearError() {
    this._error.next(null);
  }
}
