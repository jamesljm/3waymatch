// ============ Enums ============

export enum DocumentType {
  PO = 'PO',
  DO = 'DO',
  INVOICE = 'INVOICE',
}

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  CLASSIFYING = 'CLASSIFYING',
  EXTRACTING = 'EXTRACTING',
  EXTRACTED = 'EXTRACTED',
  MATCHING = 'MATCHING',
  MATCHED = 'MATCHED',
  EXCEPTION = 'EXCEPTION',
  REVIEWED = 'REVIEWED',
  EXPORTED = 'EXPORTED',
}

export enum MatchSetStatus {
  PENDING = 'PENDING',
  AUTO_MATCHED = 'AUTO_MATCHED',
  REVIEW_NEEDED = 'REVIEW_NEEDED',
  EXCEPTION = 'EXCEPTION',
  REVIEWED = 'REVIEWED',
  EXPORTED = 'EXPORTED',
}

export enum LineMatchStatus {
  MATCHED = 'MATCHED',
  DISCREPANCY = 'DISCREPANCY',
  MANUAL_MATCH = 'MANUAL_MATCH',
  UNMATCHED = 'UNMATCHED',
}

export enum ExceptionType {
  PRICE_DISCREPANCY = 'PRICE_DISCREPANCY',
  QUANTITY_DISCREPANCY = 'QUANTITY_DISCREPANCY',
  DESCRIPTION_MISMATCH = 'DESCRIPTION_MISMATCH',
  MISSING_PO = 'MISSING_PO',
  MISSING_DO = 'MISSING_DO',
  MISSING_INVOICE = 'MISSING_INVOICE',
  VENDOR_MISMATCH = 'VENDOR_MISMATCH',
  DUPLICATE_DOCUMENT = 'DUPLICATE_DOCUMENT',
  TAX_DISCREPANCY = 'TAX_DISCREPANCY',
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',
  UNRESOLVED_ITEM = 'UNRESOLVED_ITEM',
}

export enum ExceptionSeverity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// ============ Entity Types ============

export interface Vendor {
  id: string;
  vendorCode: string;
  name: string;
  address?: string | null;
  taxId?: string | null;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  description: string;
  uom?: string | null;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  vendorId?: string | null;
  vendor?: Vendor | null;
  documentNumber?: string | null;
  documentDate?: string | null;
  originalFileName: string;
  filePath: string;
  pageCount?: number | null;
  rawOcrText?: string | null;
  extractedData?: Record<string, unknown> | null;
  extractionConfidence?: number | null;
  vendorName?: string | null;
  vendorAddress?: string | null;
  subtotal?: string | null;
  taxAmount?: string | null;
  totalAmount?: string | null;
  discount?: string | null;
  currency?: string | null;
  lineItems?: DocumentLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentLineItem {
  id: string;
  documentId: string;
  lineNumber: number;
  itemCode?: string | null;
  description?: string | null;
  quantity?: string | null;
  uom?: string | null;
  unitPrice?: string | null;
  amount?: string | null;
  discount?: string | null;
  taxCode?: string | null;
  taxAmount?: string | null;
  fieldConfidence?: Record<string, number> | null;
  resolvedItemId?: string | null;
}

export interface ToleranceConfig {
  id: string;
  name: string;
  isDefault: boolean;
  vendorId?: string | null;
  priceTolerancePct: number;
  qtyTolerancePct: number;
  taxTolerancePct: number;
  amountToleranceAbs: number;
  autoApproveThreshold: number;
  reviewThreshold: number;
  createdAt: string;
  updatedAt: string;
}

// ============ API Types ============

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface CreateVendorRequest {
  vendorCode: string;
  name: string;
  address?: string;
  taxId?: string;
}

export interface UpdateVendorRequest {
  vendorCode?: string;
  name?: string;
  address?: string;
  taxId?: string;
}

export interface CreateInventoryItemRequest {
  itemCode: string;
  description: string;
  uom?: string;
}

export interface UpdateInventoryItemRequest {
  itemCode?: string;
  description?: string;
  uom?: string;
}

export interface CreatePORequest {
  documentNumber: string;
  documentDate: string;
  vendorId: string;
  currency?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  discount?: number;
  lineItems: CreatePOLineItemRequest[];
}

export interface CreatePOLineItemRequest {
  lineNumber: number;
  itemCode?: string;
  description?: string;
  quantity?: number;
  uom?: string;
  unitPrice?: number;
  amount?: number;
  discount?: number;
  taxCode?: string;
  taxAmount?: number;
}

export interface UpdateToleranceConfigRequest {
  name?: string;
  isDefault?: boolean;
  vendorId?: string | null;
  priceTolerancePct?: number;
  qtyTolerancePct?: number;
  taxTolerancePct?: number;
  amountToleranceAbs?: number;
  autoApproveThreshold?: number;
  reviewThreshold?: number;
}

export interface DocumentFilters {
  type?: DocumentType;
  status?: DocumentStatus;
  vendorId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DashboardStats {
  totalDocuments: number;
  byStatus: Record<DocumentStatus, number>;
  byType: Record<DocumentType, number>;
  totalVendors: number;
  totalInventoryItems: number;
  recentDocuments: Document[];
}
