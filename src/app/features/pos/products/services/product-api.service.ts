import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type { PageResponseDto } from '../../core/models/pos.models';
import type { ProductFilterParams, ProductListItemDto, ProductManageDetail, ProductManagePayload } from '../models/product.models';
import type { ProductMaterialRow } from '../models/product-material.models';

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

      public listProducts(params: ProductFilterParams = {}): Observable<PageResponseDto<ProductListItemDto>> {
            return this.http.get<PageResponseDto<ProductListItemDto>>(this.apiUrl, {
                  params: this.buildHttpParams(params)
            });
      }

      public filterProducts(params: ProductFilterParams): Observable<PageResponseDto<ProductListItemDto>> {
            return this.http.get<PageResponseDto<ProductListItemDto>>(`${this.apiUrl}/filter`, {
                  params: this.buildHttpParams(params)
            });
      }

      public getProductById(id: number | string): Observable<ProductListItemDto> {
            return this.http.get<ProductListItemDto>(`${this.apiUrl}/${id}`);
      }

      public getProductByCode(code: string): Observable<ProductListItemDto> {
            return this.http.get<ProductListItemDto>(`${this.apiUrl}/code/${code}`);
      }

      public getProductByBarcode(barcode: string): Observable<ProductListItemDto> {
            return this.http.get<ProductListItemDto>(`${this.apiUrl}/barcode/${barcode}`);
      }

      public createProduct(payload: Partial<ProductListItemDto>): Observable<ProductListItemDto> {
            return this.http.post<ProductListItemDto>(this.apiUrl, payload);
      }

      public updateProduct(id: number | string, payload: Partial<ProductListItemDto>): Observable<ProductListItemDto> {
            return this.http.put<ProductListItemDto>(`${this.apiUrl}/${id}`, payload);
      }

      public deleteProduct(id: number | string): Observable<void> {
            return this.http.delete<void>(`${this.apiUrl}/${id}`);
      }

      // ─── Product Management API ─────────────────────────────────────────────

      public getProductDetail(id: number): Observable<ProductManageDetail> {
            return this.http.get<ProductManageDetail>(`${this.apiUrl}/detail/${id}`);
      }

      public getProductMaterials(productId: number): Observable<ProductMaterialRow[]> {
            return this.http.get<ProductMaterialRow[]>(`${this.apiUrl}/${productId}/materials`);
      }

      public saveProduct(payload: ProductManagePayload): Observable<ProductManagePayload> {
            if (payload.id) {
                  return this.http.put<ProductManagePayload>(`${this.apiUrl}/detail/${payload.id}`, payload);
            }
            return this.http.post<ProductManagePayload>(`${this.apiUrl}/detail`, payload);
      }

      private buildHttpParams(params: ProductFilterParams): HttpParams {
            const normalized: Record<string, string | number> = { ...params };

            if (params.dateAdded && !params.dateFrom) {
                  normalized.dateFrom = params.dateAdded;
            }
            delete normalized.dateAdded;

            let httpParams = new HttpParams();
            Object.entries(normalized).forEach(([key, value]) => {
                  if (value !== undefined && value !== null && value !== '') {
                        httpParams = httpParams.set(key, value.toString());
                  }
            });
            return httpParams;
      }
}
