import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type {
  ReceiptResponse, CreateReceiptInput, UpdateReceiptInput,
  DeleteReceiptResponse, Product, Paginated,
  ReceiptFilterParams, ReceiptListItemDto, PageResponseDto,
  CashierProductDto
} from '../../core/models/pos.models';

@Injectable({
  providedIn: 'root'
})
export class CashierApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/receipt`;
  private productsApiUrl = `${environment.apiUrl}/products`;

  // --------- Receipt API ---------

  public getReceipts(page: number = 1, size: number = 10, search: string = ''): Observable<Paginated<ReceiptResponse>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<Paginated<ReceiptResponse>>(this.apiUrl, { params });
  }

  public filterReceipts(params: ReceiptFilterParams): Observable<PageResponseDto<ReceiptListItemDto>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<PageResponseDto<ReceiptListItemDto>>(`${this.apiUrl}/filter`, { params: httpParams });
  }

  public getReceiptById(id: number): Observable<ReceiptResponse> {
    return this.http.get<ReceiptResponse>(`${this.apiUrl}/${id}`);
  }

  public createReceipt(payload: CreateReceiptInput): Observable<ReceiptResponse> {
    return this.http.post<ReceiptResponse>(this.apiUrl, payload);
  }

  public updateReceipt(id: number, payload: UpdateReceiptInput): Observable<ReceiptResponse> {
    return this.http.put<ReceiptResponse>(`${this.apiUrl}/${id}`, payload);
  }

  public deleteReceipt(id: number): Observable<DeleteReceiptResponse> {
    return this.http.delete<DeleteReceiptResponse>(`${this.apiUrl}/${id}`);
  }

  // --------- Product API ---------

  public getAllProducts(): Observable<CashierProductDto[]> {
    return this.http.get<CashierProductDto[]>(`${this.productsApiUrl}/all-products`);
  }

  public getProductByBarcode(barcode: string): Observable<Product> {
    return this.http.get<Product>(`${this.productsApiUrl}/barcode/${barcode}`);
  }
}
