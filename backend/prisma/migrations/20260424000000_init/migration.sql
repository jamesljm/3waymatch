-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PO', 'DO', 'INVOICE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'CLASSIFYING', 'EXTRACTING', 'EXTRACTED', 'MATCHING', 'MATCHED', 'EXCEPTION', 'REVIEWED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "MatchSetStatus" AS ENUM ('PENDING', 'AUTO_MATCHED', 'REVIEW_NEEDED', 'EXCEPTION', 'REVIEWED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "LineMatchStatus" AS ENUM ('MATCHED', 'DISCREPANCY', 'MANUAL_MATCH', 'UNMATCHED');

-- CreateEnum
CREATE TYPE "ExceptionType" AS ENUM ('PRICE_DISCREPANCY', 'QUANTITY_DISCREPANCY', 'DESCRIPTION_MISMATCH', 'MISSING_PO', 'MISSING_DO', 'MISSING_INVOICE', 'VENDOR_MISMATCH', 'DUPLICATE_DOCUMENT', 'TAX_DISCREPANCY', 'AMOUNT_MISMATCH', 'UNRESOLVED_ITEM');

-- CreateEnum
CREATE TYPE "ExceptionSeverity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "vendorCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "taxId" TEXT,
    "aliases" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "uom" TEXT,
    "aliases" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "vendorId" TEXT,
    "documentNumber" TEXT,
    "documentDate" TIMESTAMP(3),
    "originalFileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "pageCount" INTEGER,
    "rawOcrText" TEXT,
    "extractedData" JSONB,
    "extractionConfidence" DOUBLE PRECISION,
    "vendorName" TEXT,
    "vendorAddress" TEXT,
    "subtotal" DECIMAL(18,4),
    "taxAmount" DECIMAL(18,4),
    "totalAmount" DECIMAL(18,4),
    "discount" DECIMAL(18,4),
    "currency" TEXT DEFAULT 'MYR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLineItem" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "itemCode" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(18,4),
    "uom" TEXT,
    "unitPrice" DECIMAL(18,4),
    "amount" DECIMAL(18,4),
    "discount" DECIMAL(18,4),
    "taxCode" TEXT,
    "taxAmount" DECIMAL(18,4),
    "fieldConfidence" JSONB,
    "resolvedItemId" TEXT,

    CONSTRAINT "DocumentLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSet" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "status" "MatchSetStatus" NOT NULL DEFAULT 'PENDING',
    "confidenceScore" DOUBLE PRECISION,
    "toleranceConfig" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSetDocument" (
    "id" TEXT NOT NULL,
    "matchSetId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "role" "DocumentType" NOT NULL,

    CONSTRAINT "MatchSetDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineMatch" (
    "id" TEXT NOT NULL,
    "matchSetId" TEXT NOT NULL,
    "poLineItemId" TEXT,
    "doLineItemId" TEXT,
    "invoiceLineItemId" TEXT,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "status" "LineMatchStatus" NOT NULL DEFAULT 'UNMATCHED',
    "discrepancies" JSONB,

    CONSTRAINT "LineMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchException" (
    "id" TEXT NOT NULL,
    "matchSetId" TEXT,
    "documentId" TEXT,
    "type" "ExceptionType" NOT NULL,
    "severity" "ExceptionSeverity" NOT NULL,
    "details" JSONB NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportBatch" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "exportedBy" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT,

    CONSTRAINT "ExportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportBatchItem" (
    "id" TEXT NOT NULL,
    "exportBatchId" TEXT NOT NULL,
    "matchSetId" TEXT NOT NULL,

    CONSTRAINT "ExportBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToleranceConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'default',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "vendorId" TEXT,
    "priceTolerancePct" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "qtyTolerancePct" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "taxTolerancePct" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "amountToleranceAbs" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "autoApproveThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "reviewThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToleranceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_itemCode_key" ON "InventoryItem"("itemCode");

-- CreateIndex
CREATE INDEX "Document_vendorId_type_idx" ON "Document"("vendorId", "type");

-- CreateIndex
CREATE INDEX "Document_documentNumber_idx" ON "Document"("documentNumber");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentLineItem_documentId_lineNumber_key" ON "DocumentLineItem"("documentId", "lineNumber");

-- CreateIndex
CREATE INDEX "MatchSet_vendorId_idx" ON "MatchSet"("vendorId");

-- CreateIndex
CREATE INDEX "MatchSet_status_idx" ON "MatchSet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MatchSetDocument_matchSetId_documentId_key" ON "MatchSetDocument"("matchSetId", "documentId");

-- CreateIndex
CREATE INDEX "LineMatch_matchSetId_idx" ON "LineMatch"("matchSetId");

-- CreateIndex
CREATE UNIQUE INDEX "ExportBatchItem_exportBatchId_matchSetId_key" ON "ExportBatchItem"("exportBatchId", "matchSetId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLineItem" ADD CONSTRAINT "DocumentLineItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSet" ADD CONSTRAINT "MatchSet_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSetDocument" ADD CONSTRAINT "MatchSetDocument_matchSetId_fkey" FOREIGN KEY ("matchSetId") REFERENCES "MatchSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSetDocument" ADD CONSTRAINT "MatchSetDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineMatch" ADD CONSTRAINT "LineMatch_matchSetId_fkey" FOREIGN KEY ("matchSetId") REFERENCES "MatchSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineMatch" ADD CONSTRAINT "LineMatch_poLineItemId_fkey" FOREIGN KEY ("poLineItemId") REFERENCES "DocumentLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineMatch" ADD CONSTRAINT "LineMatch_doLineItemId_fkey" FOREIGN KEY ("doLineItemId") REFERENCES "DocumentLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineMatch" ADD CONSTRAINT "LineMatch_invoiceLineItemId_fkey" FOREIGN KEY ("invoiceLineItemId") REFERENCES "DocumentLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchException" ADD CONSTRAINT "MatchException_matchSetId_fkey" FOREIGN KEY ("matchSetId") REFERENCES "MatchSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchException" ADD CONSTRAINT "MatchException_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportBatchItem" ADD CONSTRAINT "ExportBatchItem_exportBatchId_fkey" FOREIGN KEY ("exportBatchId") REFERENCES "ExportBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportBatchItem" ADD CONSTRAINT "ExportBatchItem_matchSetId_fkey" FOREIGN KEY ("matchSetId") REFERENCES "MatchSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
