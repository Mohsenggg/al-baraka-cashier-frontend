import { Injectable, computed, signal, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject, firstValueFrom } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import type { 
  ReceiptResponse, CreateReceiptInput, UpdateReceiptInput, 
  DeleteReceiptResponse, Product, ReceiptItemInput, Paginated, CartItem 
} from '../models/pos.models';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/receipts`;
  private productsApiUrl = `${environment.apiUrl}/products`;

  // --------- State Management (RxJS BehaviorSubjects) ---------
  
  private _receiptsList = new BehaviorSubject<ReceiptResponse[]>([]);
  public receipts$ = this._receiptsList.asObservable();

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
  public tax = computed(() => this.subtotal() * 0.15); // Example 15% tax if needed, adjust accordingly
  public finalTotal = computed(() => this.subtotal() + this.tax()); // Or simply subtotal if tax is included

  private currentSavedReceiptSignal = signal<ReceiptResponse | null>(null);
  public currentReceipt = this.currentSavedReceiptSignal.asReadonly();

  constructor() {}

  // --------- API Methods ---------

  public loadReceipts(page: number = 1, size: number = 10, search: string = ''): void {
    this.setLoading(true);
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    this.http.get<Paginated<ReceiptResponse>>(this.apiUrl, { params }).subscribe({
      next: (res) => {
        // Handle different pagination response formats
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
      error: (err) => {
        this.handleError(err);
      },
      complete: () => this.setLoading(false)
    });
  }

  public getReceipt(id: number): Observable<ReceiptResponse> {
    this.setLoading(true);
    return this.http.get<ReceiptResponse>(`${this.apiUrl}/${id}`).pipe(
      tap((receipt) => {
        this.currentSavedReceiptSignal.set(receipt);
        this.draftItemsSignal.set(
          receipt.items.map(i => ({ 
            productId: i.productId, 
            productName: i.productName,
            quantity: i.quantity, 
            price: i.price,
            discount: i.discount,
            total: i.total,
            remainingStock: i.remainingStock,
            product: i.product ? {
              id: i.product.id,
              name: i.product.name,
              barcode: i.product.barcode,
              costPrice: 0,
              sellingPrice: i.price,
              stockQuantity: i.product.stockQuantity,
              isActive: true,
              createdAt: '',
              updatedAt: ''
            } : {} as Product
          }))
        );
        this.clearError();
      }),
      catchError((err) => {
        this.handleError(err);
        throw err;
      }),
      tap(() => this.setLoading(false))
    );
  }

  public createReceipt(payload: CreateReceiptInput): Observable<ReceiptResponse> {
    this.setLoading(true);
    return this.http.post<ReceiptResponse>(this.apiUrl, payload).pipe(
      tap((receipt) => {
        this.currentSavedReceiptSignal.set(receipt);
        this.clearCart();
        this.clearError();
      }),
      catchError((err) => {
        this.handleError(err);
        throw err;
      }),
      tap(() => this.setLoading(false))
    );
  }

  public updateReceipt(id: number, payload: UpdateReceiptInput): Observable<ReceiptResponse> {
    this.setLoading(true);
    return this.http.put<ReceiptResponse>(`${this.apiUrl}/${id}`, payload).pipe(
      tap((receipt) => {
        this.currentSavedReceiptSignal.set(receipt);
        this.clearError();
      }),
      catchError((err) => {
        this.handleError(err);
        throw err;
      }),
      tap(() => this.setLoading(false))
    );
  }

  public deleteReceipt(id: number): Observable<DeleteReceiptResponse> {
    this.setLoading(true);
    return this.http.delete<DeleteReceiptResponse>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.clearError();
        const currentList = this._receiptsList.value;
        this._receiptsList.next(currentList.filter(r => r.id !== id));
      }),
      catchError((err) => {
        this.handleError(err);
        throw err;
      }),
      tap(() => this.setLoading(false))
    );
  }

  // --------- Products API ---------

  public getProductByBarcode(barcode: string): Promise<Product> {
    return firstValueFrom(
      this.http.get<Product>(`${this.productsApiUrl}/barcode/${barcode}`).pipe(
        catchError(err => {
          this.handleError(err);
          throw err;
        })
      )
    );
  }

  public listProducts(search: string = '', page: number = 1, size: number = 10): Promise<Paginated<Product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (search) {
      params = params.set('search', search);
    }

    return firstValueFrom(
      this.http.get<Paginated<Product>>(this.productsApiUrl, { params }).pipe(
        catchError(err => {
          this.handleError(err);
          throw err;
        })
      )
    );
  }

  // --------- Cart Form Helpers ---------

  public addCartItem(product: Product, quantity: number = 1) {
    const items = [...this.draftItemsSignal()];
    const existingIdx = items.findIndex(i => i.productId === product.id);

    if (existingIdx > -1) {
      items[existingIdx].quantity += quantity;
      items[existingIdx].total = items[existingIdx].quantity * items[existingIdx].price;
    } else {
      items.push({ 
        productId: product.id,
        productName: product.name,
        quantity, 
        price: product.sellingPrice,
        discount: 0,
        total: product.sellingPrice * quantity,
        remainingStock: product.stockQuantity,
        product
      });
    }
    this.draftItemsSignal.set(items);
  }

  public async addItemToDraftByBarcode(barcode: string, quantity: number = 1) {
    try {
      const product = await this.getProductByBarcode(barcode);
      this.addCartItem(product, quantity);
    } catch (err) {
      // Error is caught and set in the handleError method
    }
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
