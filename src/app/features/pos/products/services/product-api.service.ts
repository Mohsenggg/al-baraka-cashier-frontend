import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import type { PageResponseDto } from '../../core/models/pos.models';
import type { 
      ProductFilterParams, 
      ProductListItemDto, 
      ProductManagePayload,
      NamedEntity,
      ProductAttributeOption
} from '../models/product.models';

@Injectable({
      providedIn: 'root'
})
export class ProductApiService {
      private http = inject(HttpClient);
      private apiUrl = `${environment.apiUrl}/products`;
      private lookupUrl = `${environment.apiUrl}/lookups`;

      // ─── Products ─────────────────────────────────────────────────────────

      public listProducts(params: ProductFilterParams = {}): Observable<PageResponseDto<ProductListItemDto>> {
            return this.http.get<PageResponseDto<ProductListItemDto>>(this.apiUrl, {
                  params: this.buildHttpParams(params)
            });
      }

      public getProductById(id: number | string): Observable<ProductManagePayload> {
            return this.http.get<ProductManagePayload>(`${this.apiUrl}/${id}`);
      }

      public createProduct(payload: ProductManagePayload): Observable<ProductManagePayload> {
            return this.http.post<ProductManagePayload>(this.apiUrl, payload);
      }

      public updateProduct(id: number | string, payload: ProductManagePayload): Observable<ProductManagePayload> {
            return this.http.put<ProductManagePayload>(`${this.apiUrl}/${id}`, payload);
      }

      public deleteProduct(id: number | string): Observable<void> {
            return this.http.delete<void>(`${this.apiUrl}/${id}`);
      }

      // ─── Lookups ──────────────────────────────────────────────────────────

      public getCategories(): Observable<NamedEntity[]> {
            return this.http.get<NamedEntity[]>(`${this.lookupUrl}/categories`);
      }

      public createCategory(name: string): Observable<NamedEntity> {
            return this.http.post<NamedEntity>(`${this.lookupUrl}/categories`, { name });
      }

      public getManufacturers(): Observable<NamedEntity[]> {
            return this.http.get<NamedEntity[]>(`${this.lookupUrl}/manufacturers`);
      }

      public createManufacturer(name: string): Observable<NamedEntity> {
            return this.http.post<NamedEntity>(`${this.lookupUrl}/manufacturers`, { name });
      }

      public getSuppliers(): Observable<NamedEntity[]> {
            return this.http.get<NamedEntity[]>(`${this.lookupUrl}/suppliers`);
      }

      public createSupplier(name: string): Observable<NamedEntity> {
            return this.http.post<NamedEntity>(`${this.lookupUrl}/suppliers`, { name });
      }

      public getAttributes(): Observable<ProductAttributeOption[]> {
            return this.http.get<ProductAttributeOption[]>(`${this.lookupUrl}/attributes`);
      }

      public createAttribute(name: string): Observable<ProductAttributeOption> {
            return this.http.post<ProductAttributeOption>(`${this.lookupUrl}/attributes`, { name });
      }

      public getProductTree(params: {
            query?: string;
            categoryId?: number;
            brandId?: number;
            stockStatus?: string;
            status?: string;
            includeProducts?: boolean;
      } = {}): Observable<{ tree: any[]; statistics: any }> {
            return this.http.get<{ tree: any[]; statistics: any }>(`${this.apiUrl}/tree`, {
                  params: this.buildHttpParams(params)
            });
      }

      private buildHttpParams(params: any): HttpParams {
            const normalized: Record<string, string | number> = { ...params };

            let httpParams = new HttpParams();
            Object.entries(normalized).forEach(([key, value]) => {
                  if (value !== undefined && value !== null && value !== '') {
                        httpParams = httpParams.set(key, value.toString());
                  }
            });
            return httpParams;
      }
}
