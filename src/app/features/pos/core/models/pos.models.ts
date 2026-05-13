export type PaymentMethod = "CASH" | "TRANSFER";

export interface ReceiptItemInput {
  productCode: string;
  price: number;
  quantity: number;
  total: number;
  remainingStock: number;
}

export interface CreateReceiptInput {
  customerName: string;
  customerId: number | null;
  cashierId: number;
  paymentMethod: PaymentMethod;
  receiptType: string;
  totalQuantity: number;
  items: ReceiptItemInput[];
  tax?: number;
  discount?: number;
}

export interface UpdateReceiptInput {
  customerName: string;
  customerId: number | null;
  cashierId: number;
  paymentMethod: PaymentMethod;
  receiptType: string;
  totalQuantity: number;
  items: ReceiptItemInput[];
  tax?: number;
  discount?: number;
}

export interface ReceiptCustomer {
  id: number;
  name: string;
  phone: string;
  code: string;
}

export interface ReceiptCashier {
  id: number;
  name: string;
  code: string;
  bank: string;
}

export interface ReceiptProductSnapshot {
  id: number;
  name: string;
  barcode: string;
  stockQuantity: number;
}

export interface ReceiptItemResponse {
  id: number;
  receiptId: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  remainingStock: number;
  product: ReceiptProductSnapshot | null;
}

export interface ReceiptResponse {
  id: number;
  receiptNumber: string;
  date: string;
  subtotal: number;
  discount: number;
  tax: number;
  finalTotal: number;
  distinctItemsCount: number;
  totalQuantity: number;
  paymentMethod: PaymentMethod;
  customerId: number | null;
  cashierId: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  customer: ReceiptCustomer | null;
  cashier: ReceiptCashier;
  items: ReceiptItemResponse[];
}

export interface DeleteReceiptResponse {
  id: number;
  isDeleted: boolean;
}

export interface Product {
  id: number;
  name: string;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data?: T[];
  content?: T[];
  page: number;
  size: number;
  total?: number;
  totalElements?: number;
  totalPages?: number;
}

export interface CashierProductDto {
  id: number;
  code: string;
  name: string;
  price: number;
  stock: number;
}

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  remainingStock: number;
  product: Product;
}

export interface ReceiptFilterParams {
  code?: string;
  fromDate?: string;
  toDate?: string;
  totalMin?: number;
  totalMax?: number;
  customerName?: string;
  status?: string;
  paymentMethod?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export interface ReceiptListItemDto {
  id: number;
  receiptNumber: string;
  createdAt: string;
  finalTotal: number;
  paymentMethod: string;
}

export interface PageResponseDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
