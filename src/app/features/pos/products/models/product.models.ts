export interface DescAttribute {
      id: number;
      name: string;
      value: string;
      ui?: 1 | 2;
}

export interface ProductBarcode {
      id: number;
      barcode: string;
      sellingPrice: number;
      buyingPrice: number;
      stock: number;
      default: boolean;
}

export interface ProductSummary {
      defaultBarcodeId: number;
      maxSellingPrice: number;
      totalStock: number;
      barcodeCount: number;
}

export type ProductType = 'inventory' | 'service' | 'bundle' | 'raw';
export type ProductStatus = 'active' | 'inactive' | 'draft';
export type StockStatus = 'healthy' | 'low' | 'critical' | 'outofstock';

export interface ProductListItem {
      id: string;
      name: string;
      descAttributes?: DescAttribute[];
      code: string;
      imageUrl?: string;
      barcodes: ProductBarcode[];
      summary: ProductSummary;
      type: ProductType;
      status: ProductStatus;
      category?: string;
      minStockLevel?: number;
      maxStockLevel?: number;
      createdAt?: Date;
}

export interface ProductFilterParams {
      query?: string;
      category?: string;
      type?: string;
      stockStatus?: string;
      priceMin?: number;
      priceMax?: number;
      stockMin?: number;
      stockMax?: number;
      dateAdded?: string;
}

export interface ProductPagination {
      page: number;
      size: number;
      total: number;
      totalPages: number;
}

/** Flat API DTO — maps to ProductListItem in the state service when backend is connected. */
export interface ProductListItemDto {
      id: string;
      name: string;
      code: string;
      type: ProductType;
      status: ProductStatus;
      category?: string;
      minStockLevel?: number;
      maxStockLevel?: number;
      createdAt?: string;
      descAttributes?: DescAttribute[];
      barcodes?: ProductBarcode[];
      summary?: ProductSummary;
}

export function resolveStockStatus(stock: number, minLevel?: number, _maxLevel?: number): StockStatus {
      if (stock === 0) return 'outofstock';
      if (minLevel && stock <= minLevel) return 'critical';
      if (minLevel && stock <= minLevel * 1.5) return 'low';
      return 'healthy';
}

export function getStockClass(product: ProductListItem): StockStatus {
      return resolveStockStatus(product.summary.totalStock, product.minStockLevel, product.maxStockLevel);
}

export function getStockLabel(product: ProductListItem): string {
      const stock = product.summary.totalStock;
      if (stock === 0) return '0';
      return `${stock}`;
}

export function getTypeLabel(type: string): string {
      const labels: Record<string, string> = {
            inventory: 'منتج مخزون',
            service: 'خدمة',
            bundle: 'حزمة',
            raw: 'مادة خام'
      };
      return labels[type] || type;
}

export function getStatusLabel(status: ProductStatus): string {
      const labels: Record<ProductStatus, string> = {
            active: 'نشط',
            inactive: 'غير نشط',
            draft: 'مسودة'
      };
      return labels[status];
}

export function getStatusClass(status: ProductStatus): string {
      return `status-${status}`;
}

export function getVisibleDescAttributes(product: ProductListItem): DescAttribute[] {
      if (!product.descAttributes?.length) {
            return [];
      }

      return [...product.descAttributes]
            .filter(attr => attr.ui === 1 || attr.ui === 2)
            .sort((a, b) => (a.ui ?? 99) - (b.ui ?? 99));
}

export function getDescAttrClass(ui?: 1 | 2): string {
      return ui === 1 ? 'desc-attr-primary' : 'desc-attr-secondary';
}

export function hasMultipleBarcodes(product: ProductListItem): boolean {
      return product.summary.barcodeCount > 1;
}
