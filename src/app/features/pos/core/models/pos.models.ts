export type PaymentMethod = "CASH" | "TRANSFER";

export interface ReceiptItemInput {
  productId: number;
  quantity: number;
  discount?: number;
}

export interface CreateReceiptInput {
  customerId?: number;
  cashierId: number;
  paymentMethod: PaymentMethod;
  tax?: number;
  discount?: number;
  items: ReceiptItemInput[];
}

export interface UpdateReceiptInput {
  customerId?: number;
  cashierId: number;
  paymentMethod: PaymentMethod;
  tax?: number;
  discount?: number;
  items: ReceiptItemInput[];
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
