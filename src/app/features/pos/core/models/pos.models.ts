export type ReceiptMode = 'NEW' | 'VIEW' | 'EDIT';
export type PaymentMethod = "CASH" | "TRANSFER";

export interface ReceiptItemInput {
  productCode: string;
  sellingPrice: number;
  buyingPrice: number;
  quantity: number;
  total: number;
  remainingStock: number;
  originalQuantity?: number;
}

export interface CreateReceiptInput {
  customerName: string;
  customerPhone?: string;
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
  customerPhone?: string;
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
  productCode: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  buyingPrice: number;
  totalPrice: number;
  remainingStock: number;
  currentRemainingStock?: number;
}

export interface ReceiptResponse {
  id: number;
  receiptNumber: string;
  receiptDate: string;
  paymentMethod: PaymentMethod;
  receiptType: string;
  customerName: string;
  customerPhone?: string;
  cashierId: number;
  cashierName: string;
  totalAmount: number;
  totalQuantity: number;
  totalItems: number;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  items: ReceiptItemResponse[];
  customerId?: number | null;
  customer?: ReceiptCustomer | null;
  discount?: number;
  tax?: number;
  subtotal?: number;
  finalTotal?: number;
  cashier?: ReceiptCashier;
}

export interface DeleteReceiptResponse {
  id: number;
  isDeleted: boolean;
}

export interface RefillOption {
  parentProductId: number;
  parentProductName: string;
  parentQuantity: number;
  childQuantity: number;
  parentStock: number;
  isDefault: boolean;
}

export interface Product {
  id: number;
  name: string;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  buyingPrice: number;
  stockQuantity: number;
  stock?: number;
  refillOptions?: RefillOption[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RefillValidateRequest {
  childBarcode: string;
  parentProductId: number;
  requestedChildQuantity: number;
}

export interface RefillValidateResponse {
  isValid: boolean;
  pricingChangeRequired: boolean;
  currentBuyingPrice: number;
  newBuyingPrice: number;
  currentSellingPrice: number;
  proposedSellingPrice: number;
  currentMarkupPercentage: number;
}

export interface RefillExecuteRequest {
  childBarcode: string;
  parentProductId: number;
  requestedChildQuantity: number;
  acceptPricingChange: boolean;
  expectedNewBuyingPrice: number;
  expectedProposedSellingPrice: number;
  /** Preserved markup % — used for stale-check on the execute endpoint */
  expectedMarkupPercentage: number;
  /** How many parent units were consumed — used to update the parent's local cache after the refill */
  parentUnitsUsed: number;
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
  barcode: string;
  name: string;
  sellingPrice: number;
  buyingPrice: number;
  stock: number;
  refillOptions?: RefillOption[];
}

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  sellingPrice: number;
  buyingPrice: number;
  discount: number;
  total: number;
  remainingStock: number;
  product: Product;
  originalQuantity?: number;
  originalRemainingStock?: number;
  currentRemainingStock?: number;
  stockError?: string;
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
  receiptCode: string;
  receiptDate: string;
  totalAmount: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  status?: string;
  totalItems?: number;
  cashierName?: string;
}

export interface PageResponseDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  page?: number;
  last: boolean;
  first: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ReceiptNavigationResponse {
  currentReceiptId: number;
  currentIndex: number;
  hasPrevious: boolean;
  hasNext: boolean;
  receipts: ReceiptResponse[];
}
