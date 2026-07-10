import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type { ProductFilterParams, ProductListItemDto } from '../models/product.models';

@Injectable({
      providedIn: 'root'
})
export class ProductApiService {
      private http = inject(HttpClient);
      private apiUrl = `${environment.apiUrl}/products`;

      public getAllProducts(): Observable<ProductListItemDto[]> {
            return this.http.get<ProductListItemDto[]>(`${this.apiUrl}/all-products`);
      }

      public searchProducts(query: string = ''): Observable<ProductListItemDto[]> {
            const params = new HttpParams().set('query', query);
            return this.http.get<ProductListItemDto[]>(`${this.apiUrl}/search`, { params });
      }

      public getProductByCode(code: string): Observable<ProductListItemDto> {
            return this.http.get<ProductListItemDto>(`${this.apiUrl}/${code}`);
      }

      public getProductByBarcode(barcode: string): Observable<ProductListItemDto> {
            return this.http.get<ProductListItemDto>(`${this.apiUrl}/barcode/${barcode}`);
      }

      public createProduct(payload: Partial<ProductListItemDto>): Observable<ProductListItemDto> {
            return this.http.post<ProductListItemDto>(this.apiUrl, payload);
      }

      public updateProduct(code: string, payload: Partial<ProductListItemDto>): Observable<ProductListItemDto> {
            return this.http.put<ProductListItemDto>(`${this.apiUrl}/${code}`, payload);
      }

      public deleteProduct(code: string): Observable<void> {
            return this.http.delete<void>(`${this.apiUrl}/${code}`);
      }

      public filterProducts(params: ProductFilterParams): Observable<ProductListItemDto[]> {
            let httpParams = new HttpParams();
            Object.entries(params).forEach(([key, value]) => {
                  if (value !== undefined && value !== null && value !== '') {
                        httpParams = httpParams.set(key, value.toString());
                  }
            });
            return this.http.get<ProductListItemDto[]>(`${this.apiUrl}/filter`, { params: httpParams });
      }
}
