import { Injectable, computed, signal, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { CashierApiService } from './cashier-api.service';
import { CashierSeedService } from './cashier-seed.service';
import type {
  ReceiptResponse, CreateReceiptInput, UpdateReceiptInput,
  Product, CartItem, ReceiptFilterParams, ReceiptListItemDto, ReceiptMode
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

  private receiptModeSignal = signal<ReceiptMode>('NEW');
  public receiptMode = this.receiptModeSignal.asReadonly();

  public setReceiptMode(mode: ReceiptMode): void {
    this.receiptModeSignal.set(mode);
  }

  // Signal to hold all cached products locally
  private productsSignal = signal<Product[]>([]);
  public products = this.productsSignal.asReadonly();

  // --------- Navigation Cache State ---------
  private navigationCache: ReceiptResponse[] = [];
  private navCurrentIndex: number = -1;
  private navHasPrevious: boolean = false;
  private navHasNext: boolean = false;

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

  private setReceiptAsCurrent(receipt: ReceiptResponse) {
    this.setReceiptMode('VIEW');
    this.currentSavedReceiptSignal.set(receipt);
    
    const allProducts = this.productsSignal();
    
    this.draftItemsSignal.set(
      receipt.items.map((i, index) => {
        const foundProduct = allProducts.find(p => p.barcode === i.productCode);
        const uniqueId = foundProduct ? foundProduct.id : -(index + 1);
        
        return {
          productId: uniqueId, 
          productName: i.productName,
          quantity: i.quantity,
          price: i.unitPrice,
          discount: 0,
          total: i.totalPrice,
          remainingStock: i.remainingStock,
          product: foundProduct || this.seed.getPlaceholderProduct({
            id: uniqueId,
            name: i.productName,
            barcode: i.productCode,
            sellingPrice: i.unitPrice,
            stockQuantity: i.remainingStock + i.quantity
          })
        };
      })
    );
  }

  public getReceipt(id: number): void {
    this.setLoading(true);
    this.api.getReceiptById(id).subscribe({
      next: (receipt) => {
        this.setReceiptAsCurrent(receipt);
        this.clearError();
      },
      error: (err) => this.handleError(err),
      complete: () => this.setLoading(false)
    });
  }

  public loadNavigationCache(id: number, direction: 'NEXT' | 'PREVIOUS' = 'PREVIOUS'): void {
    this.setLoading(true);
    // Backend pagination: 'NEXT' = older receipts, 'PREVIOUS' = newer receipts
    // Frontend timeline: 'PREVIOUS' = older receipts, 'NEXT' = newer receipts
    const backendDirection = direction === 'PREVIOUS' ? 'NEXT' : 'PREVIOUS';
    console.log(`[Navigation] Loading cache for receipt ID: ${id} with frontend direction ${direction} (backend ${backendDirection})`);
    
    this.api.getReceiptNavigation(id, backendDirection, 10).subscribe({
      next: (res) => {
        console.log('[Navigation] Cache loaded from backend:', res);
        this.navigationCache = res.receipts || [];
        this.navCurrentIndex = res.currentIndex ?? -1;
        // Backend hasNext means has OLDER. Frontend navHasPrevious means can we go OLDER.
        // Backend hasPrevious means has NEWER. Frontend navHasNext means can we go NEWER.
        this.navHasPrevious = res.hasNext ?? false;
        this.navHasNext = res.hasPrevious ?? false;
        
        if (this.navigationCache.length > 0 && this.navCurrentIndex >= 0 && this.navCurrentIndex < this.navigationCache.length) {
            this.setReceiptAsCurrent(this.navigationCache[this.navCurrentIndex]);
        }
        this.clearError();
      },
      error: (err) => {
        console.error('[Navigation] Failed to load cache:', err);
        this.handleError(err);
        // Fallback to standard getReceipt so the selected receipt is at least displayed
        this.getReceipt(id);
      },
      complete: () => this.setLoading(false)
    });
  }

  public navigateReceipt(direction: 'PREVIOUS' | 'NEXT'): void {
    console.log(`[Navigation] Navigating ${direction}. Current cache length: ${this.navigationCache.length}, Current Index: ${this.navCurrentIndex}`);
    
    if (this.navigationCache.length === 0) {
      const current = this.currentSavedReceiptSignal();
      if (current && current.id) {
         console.log('[Navigation] Cache is empty, initializing with current receipt ID:', current.id);
         this.loadNavigationCache(current.id, direction);
      } else {
         if (direction === 'PREVIOUS') {
             const list = this._filteredReceipts.value;
             if (list && list.length > 0) {
                 console.log('[Navigation] Fetching the latest receipt from the list as PREVIOUS:', list[0].id);
                 this.loadNavigationCache(list[0].id, 'PREVIOUS');
             } else {
                 console.warn('[Navigation] Cannot navigate: No receipts available in the system.');
             }
         } else {
             console.log('[Navigation] Cannot move NEXT from a blank receipt.');
         }
      }
      return;
    }

    // Determine array order: isNewerFirst is true if index 0 is newer than the end of the array.
    // We assume ID sequentially correlates with time (higher ID = newer).
    let isNewerFirst = true;
    if (this.navigationCache.length >= 2) {
       isNewerFirst = this.navigationCache[0].id > this.navigationCache[this.navigationCache.length - 1].id;
    }

    // PREVIOUS = go to older receipt. NEXT = go to newer receipt.
    let targetIndex = this.navCurrentIndex;
    let fetchDirection: 'PREVIOUS' | 'NEXT' | null = null;

    if (direction === 'PREVIOUS') {
       if (isNewerFirst) targetIndex++; // moving right gets older
       else targetIndex--; // moving left gets older
       fetchDirection = 'PREVIOUS'; // when fetching, we want OLDER
    } else if (direction === 'NEXT') {
       if (isNewerFirst) targetIndex--; // moving left gets newer
       else targetIndex++; // moving right gets newer
       fetchDirection = 'NEXT'; // when fetching, we want NEWER
    }

    // Check if targetIndex is within bounds
    if (targetIndex >= 0 && targetIndex < this.navigationCache.length) {
       this.navCurrentIndex = targetIndex;
       console.log(`[Navigation] Moved in cache to index: ${this.navCurrentIndex}`);
       this.setReceiptAsCurrent(this.navigationCache[this.navCurrentIndex]);
    } else {
       // Target out of bounds, check if we can fetch more
       const canFetch = direction === 'PREVIOUS' ? this.navHasPrevious : this.navHasNext;
       if (canFetch && fetchDirection) {
          const edgeId = this.navigationCache[this.navCurrentIndex].id;
          console.log(`[Navigation] Reached edge of cache. Fetching ${fetchDirection} chunk based on ID: ${edgeId}`);
          this.fetchNavigationChunk(edgeId, fetchDirection);
       } else {
          console.log(`[Navigation] Reached absolute limit. No more ${direction} receipts.`);
          if (direction === 'NEXT') {
              console.log('[Navigation] Reached newest receipt. Clearing cart for a new blank receipt.');
              this.clearCart();
          }
       }
    }
  }

  private fetchNavigationChunk(receiptId: number, direction: 'PREVIOUS' | 'NEXT'): void {
    this.setLoading(true);
    const backendDirection = direction === 'PREVIOUS' ? 'NEXT' : 'PREVIOUS';
    console.log(`[Navigation] Fetching chunk for ID: ${receiptId} with frontend direction ${direction} (backend ${backendDirection})`);

    this.api.getReceiptNavigation(receiptId, backendDirection, 10).subscribe({
      next: (res) => {
        this.navigationCache = res.receipts || [];
        this.navCurrentIndex = res.currentIndex ?? -1;
        this.navHasPrevious = res.hasNext ?? false; // OLDER
        this.navHasNext = res.hasPrevious ?? false; // NEWER
        
        if (this.navigationCache.length > 0 && this.navCurrentIndex >= 0 && this.navCurrentIndex < this.navigationCache.length) {
            let isNewerFirst = true;
            if (this.navigationCache.length >= 2) {
               isNewerFirst = this.navigationCache[0].id > this.navigationCache[this.navigationCache.length - 1].id;
            }

            if (direction === 'PREVIOUS') {
               if (isNewerFirst && this.navCurrentIndex < this.navigationCache.length - 1) this.navCurrentIndex++;
               else if (!isNewerFirst && this.navCurrentIndex > 0) this.navCurrentIndex--;
            } else if (direction === 'NEXT') {
               if (isNewerFirst && this.navCurrentIndex > 0) this.navCurrentIndex--;
               else if (!isNewerFirst && this.navCurrentIndex < this.navigationCache.length - 1) this.navCurrentIndex++;
            }
            
            this.setReceiptAsCurrent(this.navigationCache[this.navCurrentIndex]);
        }
        this.clearError();
      },
      error: (err) => {
        console.warn('[Navigation] Fetch chunk API failed:', err);
        this.handleError(err);
      },
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
    this.setReceiptMode('NEW');
    this.draftItemsSignal.set([]);
    this.currentSavedReceiptSignal.set(null);
    this.navigationCache = [];
    this.navCurrentIndex = -1;
    this.navHasPrevious = false;
    this.navHasNext = false;
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
